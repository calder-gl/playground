import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./base_route";
import * as ts from "typescript";

/**
 * Concrete class for the `/` route.
 *
 * @class IndexRoute
 */
export class IndexRoute extends BaseRoute {
    /**
     * Create the routes.
     *
     * @class IndexRoute
     * @method create
     * @static
     */
    public static create(router: Router) {
        router.get("/", (req: Request, res: Response, next: NextFunction) => {
            new IndexRoute().index(req, res, next);
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
     * The home page route.
     *
     * @class IndexRoute
     * @method index
     * @param {Request} req The express Request object.
     * @param {Response} res The express Response object.
     * @param {NextFunction} next Execute the next method.
     */
    public index(req: Request, res: Response, _next: NextFunction) {
        const options: Object = {};
        this.render(req, res, "index", options);
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
        // Transpile the code into ES5 JavaScript
        let es5 = ts.transpile(req.body.code);

        // Pass in an object to the view to update content
        const options: Object = { code: req.body.code, source: es5 };

        // Render the index page
        this.render(req, res, "index", options);
    }
}
