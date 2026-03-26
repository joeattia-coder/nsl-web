import PolicyFooterLink, { type PolicyFooterLinkProps } from "./PolicyFooterLink";

type PrivacyFooterLinkProps = Pick<PolicyFooterLinkProps, "className" | "label">;

export default function PrivacyFooterLink({
  className = "site-footer-link",
  label = "Privacy Policy",
}: PrivacyFooterLinkProps) {
  return (
    <PolicyFooterLink
      className={className}
      label={label}
      apiPath="/api/privacy/latest"
      pageHref="/privacy"
      title="Privacy Policy"
      modalEyebrow="Privacy Policy"
      loadingMessage="Loading the latest Privacy Policy..."
      emptyMessageHtml="<p>The latest Privacy Policy is not available yet.</p>"
    />
  );
}