#!/usr/bin/env node

const { prompt } = require("enquirer");
const chalk = require("chalk");
const {
  analyzeComplexity,
  shouldDecompose,
} = require("./lib/complexity-analyzer");
const { generateIntelligentTasks } = require("./lib/intelligent-decomposer");
const {
  generateFeatureLinearContent,
  generateGitHubIssueContent,
} = require("./lib/templates");

async function main() {
  console.log(chalk.blue.bold("🔵 Feature Planning Mode Started\n"));

  // Check if epic context provided
  const epicArg = process.argv.find((arg) => arg.startsWith("--epic="));
  const epicName = epicArg ? epicArg.split("=")[1] : null;

  if (epicName) {
    console.log(chalk.cyan(`Epic Context: ${epicName}\n`));
  }

  const featureData = await prompt([
    {
      type: "input",
      name: "name",
      message: "Feature name:",
      validate: (input) => input.length > 0 || "Feature name is required",
    },
    {
      type: "input",
      name: "userStory",
      message: "User story (As a [user], I want [goal] so that [benefit]):",
      validate: (input) => input.length > 0 || "User story is required",
    },
    {
      type: "input",
      name: "description",
      message: "Feature description (technical overview):",
    },
    {
      type: "input",
      name: "acceptanceCriteria",
      message: "Acceptance criteria (comma separated):",
      validate: (input) =>
        input.length > 0 || "At least one acceptance criterion required",
    },
    {
      type: "select",
      name: "domain",
      message: "Primary domain:",
      choices: [
        "cases",
        "appointments",
        "communications",
        "auth",
        "analytics",
        "dashboard",
        "mobile",
        "other",
      ],
    },
    {
      type: "select",
      name: "storyPoints",
      message: "Story points estimate:",
      choices: ["1", "2", "3", "5", "8", "13", "21"],
      result: (value) => parseInt(value),
    },
    {
      type: "select",
      name: "priority",
      message: "Priority:",
      choices: ["Low", "Medium", "High", "Critical"],
    },
  ]);

  // Process acceptance criteria
  featureData.acceptanceCriteria = featureData.acceptanceCriteria
    .split(",")
    .map((criteria) => criteria.trim())
    .filter((criteria) => criteria.length > 0);

  // Analyze complexity
  const complexity = analyzeComplexity(featureData);

  console.log(chalk.cyan(`\n🤖 Complexity Analysis: ${complexity.level}`));
  console.log(chalk.cyan(`📊 Complexity Score: ${complexity.score}/10`));

  let tasks = [];

  if (shouldDecompose(featureData, "feature")) {
    console.log(
      chalk.yellow("\n🔄 Auto-generating tasks based on complexity...")
    );

    tasks = generateIntelligentTasks(featureData);

    console.log(chalk.green(`✅ Generated ${tasks.length} tasks`));
  } else {
    console.log(
      chalk.blue(
        "\n💡 Feature complexity is manageable - can be implemented as single task"
      )
    );
  }

  // Generate content
  const linearContent = generateFeatureLinearContent(
    featureData,
    epicName || "Standalone Feature"
  );
  const githubContent = generateGitHubIssueContent(
    featureData,
    "feature",
    epicName
  );

  console.log(chalk.green.bold("\n✅ Feature Generation Complete!\n"));

  console.log(chalk.blue("📊 Summary:"));
  console.log(`   Feature: ${featureData.name}`);
  console.log(`   Domain: ${featureData.domain}`);
  console.log(`   Story Points: ${featureData.storyPoints}`);
  console.log(`   Tasks: ${tasks.length}`);

  console.log(chalk.magenta.bold("\n📋 LINEAR FEATURE (Copy/Paste):"));
  console.log("=".repeat(60));
  console.log(linearContent);
  console.log("=".repeat(60));

  console.log(chalk.magenta.bold("\n🐙 GITHUB ISSUE (Copy/Paste):"));
  console.log("=".repeat(60));
  console.log(githubContent);
  console.log("=".repeat(60));

  if (tasks.length > 0) {
    console.log(chalk.yellow.bold("\n📝 GENERATED TASKS:"));
    tasks.forEach((task, index) => {
      console.log(chalk.yellow(`\n--- Task ${index + 1}: ${task.name} ---`));
      console.log(`Story Points: ${task.storyPoints}`);
      console.log(`Domain: ${task.domain}`);
      console.log("Technical Requirements:");
      task.technicalRequirements.forEach((req) => {
        console.log(`  - ${req}`);
      });
    });

    console.log(
      chalk.blue(
        '\n💡 Tip: Run "pnpm run task:generate" for detailed task content'
      )
    );
  }
}

main().catch((error) => {
  console.error(chalk.red("❌ Error:"), error.message);
  process.exit(1);
});
