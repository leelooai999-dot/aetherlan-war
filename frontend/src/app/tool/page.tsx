import GeneratorPage from '../generator/page';

export default async function ToolPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  return <GeneratorPage searchParams={props.searchParams} />;
}
