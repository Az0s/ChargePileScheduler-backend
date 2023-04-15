import * as fs from "fs";
import * as path from "path";

interface Route {
    method: string;
    path: string;
    description: string;
}

interface Controller {
    name: string;
    routes: Route[];
}

interface Model {
    name: string;
}

interface Service {
    name: string;
}

const basePath = path.resolve(__dirname, "../src");
const controllersDir = path.resolve(basePath, "controllers");
const modelsDir = path.resolve(basePath, "models");
const servicesDir = path.resolve(basePath, "services");

const getRoutes = (content: string): Route[] => {
    const regex = /(?<=router\.)[^(]+(?=\(['"`])/;

    const matches = content.match(regex);
    if (!matches) {
        return [];
    }
    const routes: Route[] = [];
    matches.forEach((match) => {
        const [method, path, description] = match.split(/,\s*/);
        const route: Route = {
            method: method.toUpperCase(),
            path: path.replace(/['"`]/g, ""),
            description: description.replace(/['"`]/g, ""),
        };
        routes.push(route);
    });
    return routes;
};

const getControllers = (): Controller[] => {
    const files = fs.readdirSync(controllersDir).filter((fn) => { return fn.endsWith(".ts") })
    const controllers: Controller[] = [];
    files.forEach((file) => {
        const filePath = path.resolve(controllersDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const name = file.replace(".ts", "");
        const routes = getRoutes(content);
        const controller: Controller = {
            name,
            routes,
        };
        controllers.push(controller);
    });
    return controllers;
};

const getModels = (): Model[] => {
    const files = fs.readdirSync(modelsDir);
    const models: Model[] = [];
    files.forEach((file) => {
        const name = file.replace(".js", "");
        const model: Model = {
            name,
        };
        models.push(model);
    });
    return models;
};

const getServices = (): Service[] => {
    const files = fs.readdirSync(servicesDir);
    const services: Service[] = [];
    files.forEach((file) => {
        const name = file.replace(".js", "");
        const service: Service = {
            name,
        };
        services.push(service);
    });
    return services;
};

const controllers = getControllers();
const models = getModels();
const services = getServices();

console.log("API文档:");
console.log("========================================");
controllers.forEach((controller) => {
    console.log(`## ${controller.name}`);
    controller.routes.forEach((route) => {
        console.log(`### ${route.method} ${route.path}`);
        console.log(route.description);
        console.log("---");
    });
    console.log("");
});
console.log("========================================");
console.log("Models:");
console.log(models.map((model) => model.name).join(", "));
console.log("========================================");
console.log("Services:");
console.log(services.map((service) => service.name).join(", "));
console.log("========================================");
