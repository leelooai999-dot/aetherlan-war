from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import cgi
import traceback

BASE_DIR = Path(os.environ.get('AETHERLAN_BASE_DIR', '/opt/aetherlan-war'))
PIPELINE_DIR = Path(os.environ.get('AETHERLAN_PIPELINE_DIR', Path(__file__).resolve().parents[1] / 'tools' / 'animation-pipeline'))
UPLOADS_DIR = BASE_DIR / 'uploads'
QUEUE_DIR = BASE_DIR / 'queue'
RESULTS_DIR = BASE_DIR / 'results'
LOCAL_QUEUE_DIR = PIPELINE_DIR / 'queue'
LOCAL_RESULTS_DIR = PIPELINE_DIR / 'output' / 'queue-results'
HOST = os.environ.get('AETHERLAN_HOST', '0.0.0.0')
PORT = int(os.environ.get('AETHERLAN_PORT', '8010'))
PUBLIC_APP_ORIGIN = os.environ.get('AETHERLAN_PUBLIC_APP_ORIGIN', 'https://aetherlan-war.vercel.app').strip()


def ensure_dirs() -> None:
    for path in (UPLOADS_DIR, QUEUE_DIR, RESULTS_DIR):
        path.mkdir(parents=True, exist_ok=True)


def resolve_job_path(filename: str, primary: Path, fallback: Path) -> Path:
    primary_path = primary / filename
    if primary_path.exists():
        return primary_path
    return fallback / filename


def fallback_job_key() -> str:
    return f"gen-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6]}"


def build_worker_payload(
    job_id: str,
    role: str | None,
    character_id: str | None,
    character_label: str | None,
    action: str | None,
    target_slot: str | None,
    asset_kind: str | None,
    provider: str | None,
    upload_names: list[str],
) -> dict:
    return {
        'jobId': job_id,
        'role': role or '未提供',
        'characterId': character_id or 'unassigned',
        'characterLabel': character_label or '未指定角色',
        'action': action or '未提供',
        'targetSlot': target_slot or 'unassigned',
        'assetKind': asset_kind or 'battle-animation',
        'provider': provider or '未提供',
        'uploadCount': len(upload_names),
        'uploadNames': upload_names,
        'status': 'persistent-intake-received',
        'nextStep': 'dispatch-worker-from-queue',
    }


def sanitize_job_for_client(job: dict) -> dict:
    uploads = job.get('uploads') or []
    worker_payload = job.get('workerPayload') or {}
    return {
        'id': job.get('id'),
        'createdAt': job.get('createdAt'),
        'status': job.get('status'),
        'source': job.get('source'),
        'storage': job.get('storage'),
        'request': {
            'role': (job.get('request') or {}).get('role'),
            'characterId': (job.get('request') or {}).get('characterId'),
            'characterLabel': (job.get('request') or {}).get('characterLabel'),
            'action': (job.get('request') or {}).get('action'),
            'targetSlot': (job.get('request') or {}).get('targetSlot'),
            'assetKind': (job.get('request') or {}).get('assetKind'),
            'frameCount': (job.get('request') or {}).get('frameCount'),
            'intent': (job.get('request') or {}).get('intent'),
        },
        'uploads': [
            {
                'label': f'asset-{index + 1}',
                'name': item.get('name'),
                'size': item.get('size'),
                'type': item.get('type'),
            }
            for index, item in enumerate(uploads)
        ],
        'uploadCount': len(uploads),
        'workerPayloadUploadCount': worker_payload.get('uploadCount'),
        'nextStep': job.get('nextStep'),
    }


def sanitize_worker_payload_for_client(payload: dict) -> dict:
    upload_count = payload.get('uploadCount') or len(payload.get('uploadNames') or [])
    return {
        'jobId': payload.get('jobId'),
        'role': payload.get('role'),
        'characterId': payload.get('characterId'),
        'characterLabel': payload.get('characterLabel'),
        'action': payload.get('action'),
        'targetSlot': payload.get('targetSlot'),
        'assetKind': payload.get('assetKind'),
        'uploadCount': upload_count,
        'uploads': [
            {
                'label': f"asset-{index + 1}",
            }
            for index in range(upload_count)
        ],
        'status': payload.get('status'),
        'nextStep': payload.get('nextStep'),
    }


def load_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None


def load_queue_summary() -> dict | None:
    dashboard_path = PIPELINE_DIR / 'output' / 'queue-dashboard.json'
    dashboard = load_json(dashboard_path)
    if not dashboard:
        return None
    return {
        'total': dashboard.get('total'),
        'queued': dashboard.get('queued'),
        'processing': dashboard.get('processing'),
        'done': dashboard.get('done'),
        'failed': dashboard.get('failed'),
        'health': dashboard.get('health'),
        'statusMismatches': dashboard.get('statusMismatches'),
        'orphanResults': dashboard.get('orphanResults'),
    }


def build_progress(status: str | None, result: dict | None) -> dict:
    outputs = (result or {}).get('outputs') or {}
    if outputs.get('zipReady'):
        return {'percent': 100, 'stage': 'zip-ready', 'label': 'ZIP 素材包已完成'}
    if status == 'done':
        return {
            'percent': 100,
            'stage': 'done-with-preview' if (result or {}).get('processedPreviewUrl') else 'done',
            'label': '处理完成，透明预览已生成' if (result or {}).get('processedPreviewUrl') else '处理完成，可查看结果',
        }
    if outputs.get('atlasPacked'):
        return {'percent': 85, 'stage': 'atlas-packed', 'label': '图集已打包'}
    if outputs.get('transparentFrames') or (result or {}).get('processedPreviewUrl'):
        return {'percent': 65, 'stage': 'background-removed', 'label': '背景已移除，透明预览已生成'}
    if status == 'processing':
        return {'percent': 35, 'stage': 'processing', 'label': '后台正在处理上传素材'}
    if status == 'queued':
        return {'percent': 15, 'stage': 'queued', 'label': '上传完成，任务已进入队列'}
    if status in ('failed', 'error'):
        return {'percent': 100, 'stage': 'failed', 'label': '处理失败，请检查任务结果或重新上传'}
    return {'percent': 5, 'stage': 'received', 'label': '已收到请求，正在等待同步状态'}


def load_status_payload(job_id: str) -> dict:
    job = load_json(resolve_job_path(f'{job_id}.json', QUEUE_DIR, LOCAL_QUEUE_DIR)) or {}
    result = load_json(resolve_job_path(f'{job_id}.result.json', RESULTS_DIR, LOCAL_RESULTS_DIR))
    if not job and not result:
        return {
            'ok': False,
            'jobId': job_id,
            'found': False,
            'message': 'Job not found in queue or results.',
            'code': 'job-not-found',
            'queueSummary': load_queue_summary(),
        }

    status = (result or {}).get('status') or job.get('status') or 'unknown'
    request = (result or {}).get('request') or job.get('request')
    worker_payload = job.get('workerPayload')
    uploads = job.get('uploads')
    return {
        'ok': True,
        'jobId': job_id,
        'found': True,
        'status': status,
        'progress': build_progress(status, result),
        'request': request,
        'previewUrl': (result or {}).get('previewUrl'),
        'processedPreviewUrl': (result or {}).get('processedPreviewUrl'),
        'sheetWidth': (result or {}).get('sheetWidth'),
        'sheetHeight': (result or {}).get('sheetHeight'),
        'detectedFrameCount': (result or {}).get('detectedFrameCount') or (request or {}).get('frameCount'),
        'detectedColumns': (result or {}).get('detectedColumns'),
        'detectedRows': (result or {}).get('detectedRows'),
        'detectedFrameWidth': (result or {}).get('detectedFrameWidth'),
        'detectedFrameHeight': (result or {}).get('detectedFrameHeight'),
        'outputs': (result or {}).get('outputs'),
        'storage': job.get('storage'),
        'uploads': uploads,
        'workerPayload': sanitize_worker_payload_for_client(worker_payload) if worker_payload else None,
        'queueDepth': 'persistent' if job.get('storage') == 'hetzner-disk-persistent' else None,
        'queueSummary': load_queue_summary(),
    }


def send_error_payload(handler: BaseHTTPRequestHandler, status: int, message: str, **extra: object) -> None:
    payload = {
        'ok': False,
        'message': message,
        **extra,
    }
    raw = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler._set_cors_headers()
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


class IntakeHandler(BaseHTTPRequestHandler):
    server_version = 'AetherlanIntake/0.1'

    def _cors_origin(self) -> str:
        origin = self.headers.get('Origin', '')
        if origin == PUBLIC_APP_ORIGIN:
            return origin
        return PUBLIC_APP_ORIGIN

    def _set_cors_headers(self) -> None:
        self.send_header('Access-Control-Allow-Origin', self._cors_origin())
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin')
        self.send_header('Access-Control-Max-Age', '86400')
        self.send_header('Vary', 'Origin')

    def _send_json(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in ('/api/generator', '/api/generator/status', '/health'):
            send_error_payload(self, 404, 'Not found', code='not-found', path=parsed.path)
            return
        self.send_response(204)
        self._set_cors_headers()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == '/health':
            self._send_json(200, {
                'ok': True,
                'service': 'aetherlan-war-intake',
                'storage': str(BASE_DIR),
                'publicAppOrigin': PUBLIC_APP_ORIGIN,
                'capabilities': {
                    'corsPreflight': True,
                    'generatorPost': True,
                    'generatorStatusGet': True,
                    'generatorStatusPostCompat': True,
                },
                'statusPaths': {
                    'health': '/health',
                    'generator': '/api/generator',
                    'generatorStatus': '/api/generator/status?jobId=...',
                },
            })
            return
        if parsed.path == '/api/generator/status/' and not parsed.query:
            parsed = parsed._replace(path='/api/generator/status')
        if parsed.path == '/api/generator/status':
            query = parse_qs(parsed.query)
            job_id = (query.get('jobId') or [None])[0]
            if not job_id:
                send_error_payload(
                    self,
                    400,
                    'jobId is required',
                    code='missing-job-id',
                    statusEndpoint='/api/generator/status?jobId=...',
                )
                return
            self._send_json(200, load_status_payload(job_id))
            return
        if parsed.path == '/api/generator':
            send_error_payload(
                self,
                405,
                'Use POST multipart form data on /api/generator.',
                code='method-not-allowed',
                allowedMethod='POST',
                health='/health',
                statusEndpoint='/api/generator/status?jobId=...',
            )
            return
        if parsed.path == '/api/generator/':
            send_error_payload(
                self,
                405,
                'Use POST multipart form data on /api/generator.',
                code='method-not-allowed',
                allowedMethod='POST',
                health='/health',
                statusEndpoint='/api/generator/status?jobId=...',
            )
            return
        send_error_payload(self, 404, 'Not found', code='not-found', path=parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != '/api/generator':
            if parsed.path == '/api/generator/status':
                query = parse_qs(parsed.query)
                job_id = (query.get('jobId') or [None])[0]
                if not job_id:
                    send_error_payload(
                        self,
                        400,
                        'jobId is required',
                        code='missing-job-id',
                        statusEndpoint='/api/generator/status?jobId=...',
                    )
                    return
                self._send_json(200, load_status_payload(job_id))
                return
            send_error_payload(self, 404, 'Not found', code='not-found', path=parsed.path)
            return

        ensure_dirs()
        content_type = self.headers.get('Content-Type', '')
        if 'multipart/form-data' not in content_type:
            send_error_payload(
                self,
                415,
                'Unsupported Content-Type. Use multipart/form-data with referenceFiles/uploads.',
                code='unsupported-content-type',
                receivedContentType=content_type,
                expectedContentType='multipart/form-data',
                expectedFileFields=['referenceFiles', 'uploads'],
            )
            return

        try:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    'REQUEST_METHOD': 'POST',
                    'CONTENT_TYPE': content_type,
                    'CONTENT_LENGTH': self.headers.get('Content-Length', '0'),
                },
            )
        except Exception as exc:
            send_error_payload(
                self,
                400,
                'Failed to parse multipart upload.',
                code='multipart-parse-failed',
                error=str(exc),
                receivedContentType=content_type,
            )
            return

        role = form.getfirst('role')
        character_id = form.getfirst('characterId')
        character_label = form.getfirst('characterLabel')
        action = form.getfirst('action')
        target_slot = form.getfirst('targetSlot')
        asset_kind = form.getfirst('assetKind')
        provider = form.getfirst('provider')
        frame_count = form.getfirst('frameCount')
        notes = form.getfirst('notes')
        intent = form.getfirst('intent')
        job_id = fallback_job_key()
        job_upload_dir = UPLOADS_DIR / job_id
        job_upload_dir.mkdir(parents=True, exist_ok=True)

        upload_entries = []
        upload_names: list[str] = []
        files = []
        for field_name in ('referenceFiles', 'uploads', 'references'):
            if field_name in form:
                field_value = form[field_name]
                if isinstance(field_value, list):
                    files.extend(field_value)
                else:
                    files.append(field_value)

        for item in files:
            if not getattr(item, 'filename', None):
                continue
            filename = Path(item.filename).name
            if not filename:
                continue
            raw = item.file.read()
            target = job_upload_dir / filename
            target.write_bytes(raw)
            upload_names.append(filename)
            upload_entries.append({
                'name': filename,
                'size': len(raw),
                'type': item.type or 'application/octet-stream',
                'path': str(target),
            })

        if not upload_entries:
            send_error_payload(
                self,
                400,
                'No upload files were received. Send multipart/form-data with at least one file in referenceFiles or uploads.',
                code='missing-upload-files',
                receivedFields=sorted(list(form.keys())),
                expectedFileFields=['referenceFiles', 'uploads'],
            )
            return

        worker_payload = build_worker_payload(
            job_id,
            role,
            character_id,
            character_label,
            action,
            target_slot,
            asset_kind,
            provider,
            upload_names,
        )
        job = {
            'id': job_id,
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'status': 'queued',
            'source': 'public-generator-ui',
            'storage': 'hetzner-disk-persistent',
            'request': {
                'role': role,
                'characterId': character_id,
                'characterLabel': character_label,
                'action': action,
                'targetSlot': target_slot,
                'assetKind': asset_kind,
                'frameCount': frame_count,
                'provider': provider,
                'notes': notes,
                'intent': intent,
            },
            'uploads': upload_entries,
            'workerPayload': worker_payload,
            'nextStep': 'Queued on persistent Hetzner intake. Worker dispatch is the next integration step.',
        }

        (QUEUE_DIR / f'{job_id}.json').write_text(json.dumps(job, ensure_ascii=False, indent=2), encoding='utf-8')

        accept = self.headers.get('Accept', '')
        if 'text/html' in accept:
            redirect_params = {
                'queued': '1',
                'jobId': job_id,
                'queueDepth': 'persistent',
                'uploadCount': str(len(upload_names)),
                'action': action or '',
                'role': role or '',
                'characterId': character_id or '',
                'characterLabel': character_label or '',
                'targetSlot': target_slot or '',
                'assetKind': asset_kind or '',
            }
            from urllib.parse import urlencode
            location = f"{PUBLIC_APP_ORIGIN.rstrip('/')}/generator?{urlencode(redirect_params)}"
            self.send_response(303)
            self.send_header('Location', location)
            self.end_headers()
            return

        response_payload = {
            'ok': True,
            'status': 'queued',
            'job': sanitize_job_for_client(job),
            'workerPayload': sanitize_worker_payload_for_client(worker_payload),
            'queueDepth': 'persistent',
        }
        self._send_json(200, response_payload)

    def log_message(self, format: str, *args) -> None:
        print(f'{self.address_string()} - - [{self.log_date_time_string()}] {format % args}')


def main() -> None:
    ensure_dirs()
    server = HTTPServer((HOST, PORT), IntakeHandler)
    print(f'Aetherlan intake server listening on http://{HOST}:{PORT}')
    server.serve_forever()


if __name__ == '__main__':
    main()
