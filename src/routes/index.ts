import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./base_route";
import { transform } from 'babel-core';
import  * as fs from 'fs';
import * as path from "path";
import { range } from 'lodash';

/**
 * Concrete class for the `/` route.
 *
 * @class IndexRoute
 */
export class IndexRoute extends BaseRoute {
    private static defaultSource: string =
        '' + fs.readFileSync(path.join(__dirname, '../../samples/tree.js'));

    /**
     * Create the routes.
     *
     * @class IndexRoute
     * @method create
     * @static
     */
    public static create(router: Router) {
        router.get("/", (req: Request, res: Response, _next: NextFunction) => {
            new IndexRoute().renderGL(req, res);
        });

        router.post("/", (req: Request, res: Response) => {
            new IndexRoute().renderGL(req, res);
        });
    }

    /**
     * Instantiate a new `IndexRoute` object.
     *
     * @class IndexRoute
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Renders the CalderGL and displays it in the canvas.
     *
     * @class IndexRoute
     * @method render
     * @param {Request} req The express Request object.
     * @param {Response} res The express Response object.
     */
    public renderGL(req: Request, res: Response) {
        console.log(req.body.source);
        const source = req.body.source || IndexRoute.defaultSource;
        const focused = req.body.focused || 0;
        const seeds = range(4).map((i: number) => req.body[`seed${i}`] || Math.random() * 100000);

        // Transpile the code into ES5 JavaScript
        const { code } = transform(source, { sourceType: 'script' });

        // Pass in an object to the view to update content
        const options: Object = { source, code, seeds, focused };

        // Render the index page
        this.render(req, res, "index", options);
    }
}
