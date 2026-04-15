export function RenderComponent({ data }) {
  // Pattern Factory simple pour le rendu
  switch (data.type) {
    case 'Hero':
      return (
        <section className="w-full py-24 px-4 bg-pb-accent text-white flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">{data.props.title}</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl">{data.props.subtitle}</p>
        </section>
      );
    case 'Text':
      return (
        <div className="container mx-auto py-12 px-4 text-pb-foreground">
          <p>{data.props.content}</p>
        </div>
      );
    default:
      return <div className="p-4 text-red-500">Composant inconnu {data.type}</div>;
  }
}