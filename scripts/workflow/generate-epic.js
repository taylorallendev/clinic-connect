#!/usr/bin/env node

const { prompt } = require("enquirer");
const chalk = require("chalk");
const {
  analyzeComplexity,
  shouldDecompose,
} = require("./lib/complexity-analyzer");
const {
  generateIntelligentFeatures,
  generateIntelligentTasks,
} = require("./lib/intelligent-decomposer");
const { createEpicFiles } = require("./lib/file-manager");
const { generateCopyPasteContent } = require("./lib/templates");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  console.log(chalk.magenta.bold("🟣 Epic Planning Mode Started\n"));

  const epicData = await prompt([
    {
      type: "input",
      name: "name",
      message: "Epic name (major initiative):",
      validate: (input) => input.length > 0 || "Epic name is required",
    },
    {
      type: "input",
      name: "description",
      message: "Epic description (high-level business goal):",
      validate: (input) => input.length > 0 || "Description is required",
    },
    {
      type: "input",
      name: "businessValue",
      message: "Business value/ROI:",
    },
    {
      type: "select",
      name: "timeline",
      message: "Estimated timeline:",
      choices: [
        "1-2 weeks",
        "3-4 weeks",
        "1-2 months",
        "2-3 months",
        "3+ months",
      ],
    },
    {
      type: "input",
      name: "successMetrics",
      message: "Success metrics:",
    },
    {
      type: "input",
      name: "dependencies",
      message: "Dependencies/constraints:",
    },
    {
      type: "select",
      name: "priority",
      message: "Priority:",
      choices: ["Low", "Medium", "High", "Critical"],
    },
  ]);

  // Analyze complexity
  const complexity = analyzeComplexity(epicData);

  console.log(chalk.cyan(`\n🤖 Complexity Analysis: ${complexity.level}`));
  console.log(chalk.cyan(`📊 Complexity Score: ${complexity.score}/10`));
  console.log(
    chalk.cyan(
      `🔍 Factors: ${Object.keys(complexity.factors)
        .filter((key) => complexity.factors[key])
        .join(", ")}`
    )
  );

  let features = [];
  let allTasks = [];

  if (shouldDecompose(epicData, "epic")) {
    console.log(
      chalk.yellow("\n🔄 Auto-generating features based on complexity...")
    );

    features = generateIntelligentFeatures(epicData);

    console.log(chalk.green(`✅ Generated ${features.length} features`));

    // Generate tasks for complex features
    for (const feature of features) {
      if (shouldDecompose(feature, "feature")) {
        console.log(
          chalk.yellow(`🔄 Breaking down "${feature.name}" into tasks...`)
        );

        const tasks = generateIntelligentTasks(feature);
        tasks.forEach((task) => {
          task.featureSlug = require("./lib/file-manager").slugify(
            feature.name
          );
        });
        allTasks.push(...tasks);

        console.log(
          chalk.green(
            `✅ Generated ${tasks.length} tasks for "${feature.name}"`
          )
        );
      }
    }
  } else {
    console.log(
      chalk.blue(
        "\n💡 Epic complexity is manageable - no auto-decomposition needed"
      )
    );

    const { shouldCreateFeatures } = await prompt({
      type: "confirm",
      name: "shouldCreateFeatures",
      message: "Would you like to manually create features for this epic?",
      initial: false,
    });

    if (shouldCreateFeatures) {
      // Manual feature creation flow
      console.log(chalk.blue("\n📝 Manual feature creation mode..."));
      // Add manual feature creation logic here if needed
    }
  }

  console.log(chalk.yellow("\n📁 Creating file structure..."));

  // Create files
  const fileResults = await createEpicFiles(epicData, features, allTasks);

  // Generate copy-paste content
  const copyPasteContent = generateCopyPasteContent(
    epicData,
    features,
    allTasks
  );

  // Save copy-paste content to file
  const copyPasteFile = path.join(fileResults.epicDir, "copy-paste-content.md");
  await fs.writeFile(copyPasteFile, copyPasteContent);

  // Display results
  console.log(chalk.green.bold("\n✅ Epic Generation Complete!\n"));

  console.log(chalk.blue("📊 Summary:"));
  console.log(`   Epic: ${epicData.name}`);
  console.log(`   Features: ${features.length}`);
  console.log(`   Tasks: ${allTasks.length}`);
  console.log(
    `   Total Story Points: ${features.reduce((sum, f) => sum + (f.storyPoints || 0), 0)}`
  );

  console.log(chalk.blue("\n📁 Files Created:"));
  console.log(`   ${fileResults.epicDir}/epic.md`);
  console.log(`   ${fileResults.epicDir}/copy-paste-content.md`);
  if (features.length > 0) {
    console.log(`   ${fileResults.featuresCount} feature directories`);
    console.log(`   ${fileResults.tasksCount} task files`);
  }

  console.log(chalk.yellow.bold("\n📋 Next Steps:"));
  console.log(
    `1. Review the generated plan in: ${fileResults.epicDir}/copy-paste-content.md`
  );
  console.log(`2. Copy-paste the Linear/GitHub content from the file above`);
  console.log(
    `3. Create branches: git checkout -b epic/${fileResults.epicSlug}`
  );
  console.log(`4. Start with the first feature implementation`);

  // Display copy-paste content preview
  console.log(chalk.magenta.bold("\n📋 COPY-PASTE CONTENT PREVIEW:"));
  console.log(chalk.gray("(Full content saved to copy-paste-content.md)\n"));

  // Show just the epic and first feature as preview
  const lines = copyPasteContent.split("\n");
  const previewLines = lines.slice(0, 50); // First 50 lines
  console.log(previewLines.join("\n"));

  if (lines.length > 50) {
    console.log(
      chalk.gray(`\n... and ${lines.length - 50} more lines in the file`)
    );
  }
}

main().catch((error) => {
  console.error(chalk.red("❌ Error:"), error.message);
  process.exit(1);
});
