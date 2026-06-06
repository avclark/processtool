import { SectionShell } from "@/components/design-system/SectionShell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const code = `// Mount once near the app root:
import { ToastProvider } from "@/components/ui/toast";

<ToastProvider>
  <App />
</ToastProvider>

// Then call the imperative API from anywhere inside it:
import { useToast } from "@/components/ui/toast";

const { success, error } = useToast();

success("Show created");
error("Couldn't save", "Please try again.");`;

export function ToastSection() {
  const { success, error } = useToast();

  return (
    <SectionShell
      id="toast"
      title="Toast"
      description={
        <>
          Transient notifications built on Radix Toast, styled with the design
          tokens. Two tones — <code>success</code> (accent) and{" "}
          <code>error</code> (danger). Toasts stack bottom-right, auto-dismiss
          after ~4s, can be swiped away, and are announced to screen readers.
          Mount <code>&lt;ToastProvider&gt;</code> once near the root, then fire
          them imperatively via the <code>useToast()</code> hook.
        </>
      }
      whenToUse={
        <ul>
          <li>Confirming a write succeeded (saved, created, deleted).</li>
          <li>Reporting a non-blocking error after an action.</li>
        </ul>
      }
      whenNotToUse={
        <ul>
          <li>Blocking confirmations — use a modal.</li>
          <li>Persistent inline validation — use field helper text.</li>
          <li>Critical errors that must be acknowledged.</li>
        </ul>
      }
      preview={
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => success("Show created")}>
            Trigger success
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              success("Show updated", "Your changes have been saved.")
            }
          >
            Success with description
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              error("Couldn't save", "Something went wrong. Please try again.")
            }
          >
            Trigger error
          </Button>
        </div>
      }
      code={code}
      options={
        <ul className="list-disc pl-5">
          <li>
            <code>useToast()</code> returns <code>success(title, description?)</code>,{" "}
            <code>error(title, description?)</code>, and the lower-level{" "}
            <code>toast(&#123; tone, title, description, duration &#125;)</code>.
          </li>
          <li>
            <code>tone</code>: <code>success</code> | <code>error</code>.
          </li>
          <li>
            <code>description</code> is optional supporting copy below the title.
          </li>
          <li>
            <code>duration</code> defaults to 4000ms; toasts are also dismissible
            and swipeable.
          </li>
        </ul>
      }
    />
  );
}
