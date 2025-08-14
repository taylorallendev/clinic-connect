#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");

async function readEpicDirectories() {
  try {
    const epicsDir = path.join(".claude", "epics");
    const epicDirs = await fs.readdir(epicsDir);

    const epics = [];

    for (const epicDir of epicDirs) {
      const epicPath = path.join(epicsDir, epicDir);
      const stats = await fs.stat(epicPath);

      if (stats.isDirectory()) {
        try {
          const epicFile = path.join(epicPath, "epic.md");
          const epicContent = await fs.readFile(epicFile, "utf8");

          // Count features
          const featuresDir = path.join(epicPath, "features");
          let featuresCount = 0;
          let tasksCount = 0;

          try {
            const features = await fs.readdir(featuresDir);
            featuresCount = features.length;

            // Count tasks across all features
            for (const feature of features) {
              const tasksDir = path.join(featuresDir, feature, "tasks");
              try {
                const tasks = await fs.readdir(tasksDir);
                tasksCount += tasks.length;
              } catch (e) {
                // No tasks directory
              }
            }
          } catch (e) {
            // No features directory
          }

          epics.push({
            name: epicDir,
            path: epicPath,
            featuresCount,
            tasksCount,
            content: epicContent,
          });
        } catch (e) {
          console.log(
            chalk.yellow(`⚠️  Skipping invalid epic directory: ${epicDir}`)
          );
        }
      }
    }

    return epics;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function main() {
  console.log(chalk.blue.bold("📊 Workflow Dashboard\n"));

  const epics = await readEpicDirectories();

  if (epics.length === 0) {
    console.log(
      chalk.yellow(
        'No epics found. Run "pnpm run epic:generate" to create your first epic.'
      )
    );
    return;
  }

  console.log(chalk.green(`Found ${epics.length} epic(s):\n`));

  let totalFeatures = 0;
  let totalTasks = 0;

  epics.forEach((epic, index) => {
    console.log(
      chalk.blue.bold(
        `${index + 1}. ${epic.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
      )
    );
    console.log(chalk.gray(`   📁 ${epic.path}`));
    console.log(chalk.cyan(`   📋 Features: ${epic.featuresCount}`));
    console.log(chalk.cyan(`   ✅ Tasks: ${epic.tasksCount}`));

    // Extract status from content if possible
    const statusMatch = epic.content.match(/Status:\s*(.+)/);
    if (statusMatch) {
      const status = statusMatch[1].trim();
      const statusColor = status.toLowerCase().includes("complete")
        ? "green"
        : status.toLowerCase().includes("progress")
          ? "yellow"
          : "gray";
      console.log(chalk[statusColor](`   🔄 Status: ${status}`));
    }

    console.log(""); // Empty line

    totalFeatures += epic.featuresCount;
    totalTasks += epic.tasksCount;
  });

  console.log(chalk.blue.bold("📈 Summary:"));
  console.log(chalk.green(`   Total Epics: ${epics.length}`));
  console.log(chalk.green(`   Total Features: ${totalFeatures}`));
  console.log(chalk.green(`   Total Tasks: ${totalTasks}`));

  console.log(chalk.yellow.bold("\n🚀 Available Commands:"));
  console.log(chalk.gray("   pnpm run epic:generate      - Create new epic"));
  console.log(
    chalk.gray("   pnpm run feature:generate   - Create new feature")
  );
  console.log(chalk.gray("   pnpm run task:generate      - Create new task"));
  console.log(
    chalk.gray("   pnpm run workflow:dashboard - View this dashboard")
  );
}

main().catch((error) => {
  console.error(chalk.red("❌ Error:"), error.message);
  process.exit(1);
});
