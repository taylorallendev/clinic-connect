#!/usr/bin/env node

const { prompt } = require("enquirer");
const chalk = require("chalk");
const {
  generateTaskLinearContent,
  generateGitHubIssueContent,
} = require("./lib/templates");

async function main() {
  console.log(chalk.yellow.bold("🟡 Task Planning Mode Started\n"));

  // Check if feature context provided
  const featureArg = process.argv.find((arg) => arg.startsWith("--feature="));
  const featureName = featureArg ? featureArg.split("=")[1] : null;

  if (featureName) {
    console.log(chalk.cyan(`Feature Context: ${featureName}\n`));
  }

  const taskData = await prompt([
    {
      type: "input",
      name: "name",
      message: "Task name:",
      validate: (input) => input.length > 0 || "Task name is required",
    },
    {
      type: "input",
      name: "description",
      message: "Task description:",
      validate: (input) => input.length > 0 || "Description is required",
    },
    {
      type: "select",
      name: "domain",
      message: "Domain:",
      choices: [
        "cases",
        "appointments",
        "communications",
        "auth",
        "analytics",
        "dashboard",
        "ui",
        "backend",
        "integration",
        "other",
      ],
    },
    {
      type: "input",
      name: "technicalRequirements",
      message: "Technical requirements (comma separated):",
      validate: (input) =>
        input.length > 0 || "At least one technical requirement needed",
    },
    {
      type: "select",
      name: "storyPoints",
      message: "Story points estimate:",
      choices: ["1", "2", "3", "5", "8"],
      result: (value) => parseInt(value),
    },
    {
      type: "input",
      name: "filesToModify",
      message: "Files to create/modify (optional):",
    },
    {
      type: "select",
      name: "priority",
      message: "Priority:",
      choices: ["Low", "Medium", "High"],
    },
  ]);

  // Process technical requirements
  taskData.technicalRequirements = taskData.technicalRequirements
    .split(",")
    .map((req) => req.trim())
    .filter((req) => req.length > 0);

  // Generate content
  const linearContent = generateTaskLinearContent(
    taskData,
    featureName || "Standalone Task"
  );
  const githubContent = generateGitHubIssueContent(
    taskData,
    "task",
    featureName
  );

  console.log(chalk.green.bold("\n✅ Task Generation Complete!\n"));

  console.log(chalk.blue("📊 Summary:"));
  console.log(`   Task: ${taskData.name}`);
  console.log(`   Domain: ${taskData.domain}`);
  console.log(`   Story Points: ${taskData.storyPoints}`);
  console.log(`   Requirements: ${taskData.technicalRequirements.length}`);

  console.log(chalk.magenta.bold("\n📋 LINEAR TASK (Copy/Paste):"));
  console.log("=".repeat(60));
  console.log(linearContent);
  console.log("=".repeat(60));

  console.log(chalk.magenta.bold("\n🐙 GITHUB ISSUE (Copy/Paste):"));
  console.log("=".repeat(60));
  console.log(githubContent);
  console.log("=".repeat(60));

  console.log(chalk.yellow.bold("\n📝 Implementation Notes:"));
  console.log(`• Domain directory: /app/actions/${taskData.domain}/`);
  console.log(`• Estimated effort: ${taskData.storyPoints} story points`);
  console.log(`• Priority: ${taskData.priority}`);
  if (taskData.filesToModify) {
    console.log(`• Files to modify: ${taskData.filesToModify}`);
  }
}

main().catch((error) => {
  console.error(chalk.red("❌ Error:"), error.message);
  process.exit(1);
});
