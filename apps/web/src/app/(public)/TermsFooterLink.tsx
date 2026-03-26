import PolicyFooterLink, { type PolicyFooterLinkProps } from "./PolicyFooterLink";

type TermsFooterLinkProps = Pick<PolicyFooterLinkProps, "className" | "label">;

export default function TermsFooterLink({
  className = "site-footer-link",
  label = "Terms of Service",
}: TermsFooterLinkProps) {
  return (
    <PolicyFooterLink
      className={className}
      label={label}
      apiPath="/api/terms/latest"
      pageHref="/terms"
      title="Terms of Service"
      modalEyebrow="Terms of Service"
      loadingMessage="Loading the latest Terms of Service..."
      emptyMessageHtml="<p>The latest Terms of Service are not available yet.</p>"
    />
  );
}