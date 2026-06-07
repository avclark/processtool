import { SectionShell } from "@/components/design-system/SectionShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const code = `import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

<Tabs defaultValue="content">
  <TabsList>
    <TabsTrigger value="content">Content</TabsTrigger>
    <TabsTrigger value="assignment">Assignment</TabsTrigger>
    <TabsTrigger value="dates">Dates</TabsTrigger>
  </TabsList>
  <TabsContent value="content">Content panel…</TabsContent>
  <TabsContent value="assignment">Assignment panel…</TabsContent>
  <TabsContent value="dates">Dates panel…</TabsContent>
</Tabs>`;

export function TabsSection() {
  return (
    <SectionShell
      id="tabs"
      title="Tabs"
      description={
        <>
          Inline tabs built on Radix Tabs. Use <code>defaultValue</code> for an
          uncontrolled tab set, or <code>value</code> + <code>onValueChange</code>
          {" "}to control it. Keyboard-navigable (arrow keys) and accessible by
          default. The active trigger is underlined with the accent color.
        </>
      }
      whenToUse={
        <ul>
          <li>Switching between facets of one object in place (e.g. a builder card).</li>
          <li>Sectioning a dense editor without navigating away.</li>
        </ul>
      }
      whenNotToUse={
        <ul>
          <li>Primary page navigation — use the nav.</li>
          <li>Sequential steps that must be completed in order — use a wizard.</li>
        </ul>
      }
      preview={
        <div className="max-w-lg">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="dates">Dates</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <p>The content panel — blocks would live here.</p>
            </TabsContent>
            <TabsContent value="assignment">
              <p>The assignment panel — role/user pickers here.</p>
            </TabsContent>
            <TabsContent value="dates">
              <p>The dates panel — start/due date rules here.</p>
            </TabsContent>
          </Tabs>
        </div>
      }
      code={code}
      options={
        <ul className="list-disc pl-5">
          <li>
            <code>defaultValue</code> / <code>value</code> +{" "}
            <code>onValueChange</code> on <code>&lt;Tabs&gt;</code>.
          </li>
          <li>
            Each <code>&lt;TabsTrigger&gt;</code> and its{" "}
            <code>&lt;TabsContent&gt;</code> share a <code>value</code>.
          </li>
          <li>
            <code>orientation="vertical"</code> on <code>&lt;Tabs&gt;</code> is
            supported by Radix if needed.
          </li>
        </ul>
      }
    />
  );
}
