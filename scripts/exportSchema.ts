import * as fs from "fs";
import * as path from "path";

const srcDir: string = "src/models";
const outputFile: string = "output.txt";

fs.readdir(srcDir, (err, files) => {
    if (err) throw err;

    let content: string = "";

    files.forEach((file) => {
        const filePath = path.join(srcDir, file);
        const fileContent = fs.readFileSync(filePath, "utf8");
        content += `======= ${file} =======\n`;
        content += `${fileContent}\n\n`;
    });

    fs.writeFileSync(outputFile, content);

    console.log(`All model files in ${srcDir} are written to ${outputFile}`);
});
