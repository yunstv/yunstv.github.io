"use client";

import Link from "next/link";
import { Box, Card, Flex, Grid, Tabs, Text } from "@radix-ui/themes";
import { GridIcon, ImageIcon, ListBulletIcon } from "@radix-ui/react-icons";
import { useTabParam } from "@/components/shared/use-tab-param";
import { getToolIcon, getToolIllustration } from "./tool-illustrations";

export type ToolItem = {
  href: string;
  name: string;
  desc: string;
};

function ToolCard({ tool, compact }: { tool: ToolItem; compact?: boolean }) {
  const Icon = getToolIcon(tool.href);
  return (
    <Card asChild>
      <Link
        href={tool.href}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          height: "100%",
        }}
      >
        <Flex align="start" gap="3" height="100%">
          <Box
            style={{
              color: "var(--accent-9)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--accent-a3)",
              marginTop: 2,
            }}
          >
            <Icon width={20} height={20} />
          </Box>
          <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
            <Text size={compact ? "3" : "4"} weight="medium">
              {tool.name}
            </Text>
            <Text size="2" color="gray">
              {tool.desc}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
}

function ToolIllustrationCard({ tool }: { tool: ToolItem }) {
  const Illu = getToolIllustration(tool.href);
  return (
    <Card asChild>
      <Link
        href={tool.href}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          height: "100%",
        }}
      >
        <Flex direction="column" gap="3" height="100%">
          <Box
            style={{
              aspectRatio: "5 / 3",
              background: "var(--accent-a2)",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Illu />
          </Box>
          <Flex direction="column" gap="1">
            <Text size="3" weight="medium">
              {tool.name}
            </Text>
            <Text size="2" color="gray">
              {tool.desc}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
}

export function ToolsList({ tools }: { tools: ToolItem[] }) {
  const [value, setValue] = useTabParam("tab", "illustrated");
  return (
    <Tabs.Root value={value} onValueChange={setValue}>
      <Tabs.List>
        <Tabs.Trigger value="illustrated">
          <Flex align="center" gap="2">
            <ImageIcon />
            图文
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="list">
          <Flex align="center" gap="2">
            <ListBulletIcon />
            列表
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="grid">
          <Flex align="center" gap="2">
            <GridIcon />
            网格
          </Flex>
        </Tabs.Trigger>
      </Tabs.List>
      <Box pt="4">
        <Tabs.Content value="illustrated">
          <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
            {tools.map((t) => (
              <ToolIllustrationCard key={t.href} tool={t} />
            ))}
          </Grid>
        </Tabs.Content>
        <Tabs.Content value="list">
          <Flex direction="column" gap="3">
            {tools.map((t) => (
              <ToolCard key={t.href} tool={t} />
            ))}
          </Flex>
        </Tabs.Content>
        <Tabs.Content value="grid">
          <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
            {tools.map((t) => (
              <ToolCard key={t.href} tool={t} compact />
            ))}
          </Grid>
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
}
