# Moving Jest Test Folder

We have moved the folder containing Jest tests out of the src directory. The reason for this is that after converting the project to TypeScript, these test files conflicted with the Jest framework we were using.

To run the tests, navigate to the root directory of the project and run the following command:

npm run test
This will run all of the tests in the project, including those in the moved test folder.

## Original package.json

```json
    "scripts": {
        "build": "npx tsc",
        "start": "node dist/index.js",
        "dev": "concurrently \"npx tsc --watch\" \"nodemon -q dist/index.js\"",
        "test": "jest --watchAll --verbose false",
        "test:leak": "jest --watchAll --verbose --detectOpenHandles",
        "test:cov": "npm test -- --coverage --watchAll=false",
        "deploy": "npx tsc && cp ./configuration/web.config ./dist "
    },

```
