import NewsForm from "../news-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditNewsArticlePage({ params }: PageProps) {
  const { id } = await params;
  return <NewsForm mode="edit" articleId={id} />;
}
