/** Mostra o corpo de um artigo: parágrafos, listas com "- " e passos com "1. ". */
export default function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean));
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((lines, index) => {
        if (lines.every((line) => /^\d+\.\s/.test(line))) {
          return <ol key={index} className="list-decimal space-y-1 pl-5">{lines.map((line) => <li key={line}>{line.replace(/^\d+\.\s/, '')}</li>)}</ol>;
        }
        if (lines.every((line) => line.startsWith('- '))) {
          return <ul key={index} className="list-disc space-y-1 pl-5">{lines.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
        }
        return <p key={index}>{lines.join(' ')}</p>;
      })}
    </div>
  );
}
