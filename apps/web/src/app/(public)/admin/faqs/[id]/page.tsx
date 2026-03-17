import FaqForm from "../faq-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFaqPage({ params }: PageProps) {
  const { id } = await params;

  return <FaqForm mode="edit" faqId={id} />;
}
