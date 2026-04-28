from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from http.server import BaseHTTPRequestHandler, HTTPServer
import cgi
import traceback

BASE_DIR = Path(os.environ.get('AETHERLAN_BASE_DIR', '/opt/aetherlan-war'))
UPLOADS_DIR = BASE_DIR / 'uploads'
QUEUE_DIR = BASE_DIR / 'queue'
RESULTS_DIR = BASE_DIR / 'results'
HOST = os.environ.get('AETHERLAN_HOST', '0.0.0.0')
PORT = int(os.environ.get('AETHERLAN_PORT', '8010'))
PUBLIC_APP_ORIGIN = os.environ.get('AETHERLAN_PUBLIC_APP_ORIGIN', 'https://aetherlan-war.vercel.app')


def ensure_dirs() -> None:
    for path in (UPLOADS_DIR, QUEUE_DIR, RESULTS_DIR):
        path.mkdir(parents=True, exist_ok=True)


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
        'characterId': character_id,
        'characterLabel': character_label,
        'action': action or '未提供',
        'targetSlot': target_slot,
        'assetKind': asset_kind,
        'provider': provider or '未提供',
        'uploadCount': len(upload_names),
        'status': 'persistent-intake-received',
        'nextStep': 'dispatch-worker-from-queue',
    }


def sanitize_job_for_client(job: dict) -> dict:
    uploads = job.get('uploads') or []
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
                'size': item.get('size'),
                'type': item.get('type'),
            }
            for index, item in enumerate(uploads)
        ],
        'nextStep': job.get('nextStep'),
    }


def sanitize_worker_payload_for_client(payload: dict) -> dict:
    return {
        'jobId': payload.get('jobId'),
        'role': payload.get('role'),
        'characterId': payload.get('characterId'),
        'characterLabel': payload.get('characterLabel'),
        'action': payload.get('action'),
        'targetSlot': payload.get('targetSlot'),
        'assetKind': payload.get('assetKind'),
        'uploadCount': payload.get('uploadCount'),
        'status': payload.get('status'),
        'nextStep': payload.get('nextStep'),
    }


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
        self.send_response(204)
        self._set_cors_headers()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == '/health':
            self._send_json(200, {'ok': True, 'service': 'aetherlan-war-intake', 'storage': str(BASE_DIR)})
            return
        if self.path == '/api/generator':
            self._send_json(405, {
                'ok': False,
                'message': 'Use POST multipart form data on /api/generator.',
                'health': '/health',
            })
            return
        self._send_json(404, {'ok': False, 'message': 'Not found'})

    def do_POST(self) -> None:
        if self.path != '/api/generator':
            self._send_json(404, {'ok': False, 'message': 'Not found'})
            return

        ensure_dirs()
        content_type = self.headers.get('Content-Type', '')
        if 'multipart/form-data' not in content_type:
            self._send_json(415, {
                'ok': False,
                'message': 'Unsupported Content-Type. Use multipart/form-data with referenceFiles.',
                'receivedContentType': content_type,
            })
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
            self._send_json(400, {
                'ok': False,
                'message': 'Failed to parse multipart upload.',
                'error': str(exc),
            })
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
        if 'referenceFiles' in form:
            files = form['referenceFiles']
            if not isinstance(files, list):
                files = [files]
        else:
            files = []

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

        self._send_json(200, {
            'ok': True,
            'status': 'queued',
            'job': sanitize_job_for_client(job),
            'workerPayload': sanitize_worker_payload_for_client(worker_payload),
            'queueDepth': 'persistent',
        })

    def log_message(self, format: str, *args) -> None:
        print(f'{self.address_string()} - - [{self.log_date_time_string()}] {format % args}')


def main() -> None:
    ensure_dirs()
    server = HTTPServer((HOST, PORT), IntakeHandler)
    print(f'Aetherlan intake server listening on http://{HOST}:{PORT}')
    server.serve_forever()


if __name__ == '__main__':
    main()
