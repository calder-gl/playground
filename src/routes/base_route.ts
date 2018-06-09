import { NextFunction, Request, Response } from "express";

/**
 * Abstract base class all routes should extend from.
 *
 * @class BaseRoute
 */
export class BaseRoute {
    protected title: string;
    private scripts: string[];

    /**
     * Instantiate a new `BaseRoute` object.
     *
     * @class BaseRoute
     * @constructor
     */
    constructor() {
        this.title = "Calder Playground";
        this.scripts = [];
    }

    /**
     * Add a JS external file to the request.
     *
     * @class BaseRoute
     * @method addScript
     * @param {string} src The src to the external JS file.
     * @return {BaseRoute} Self for chaining
     */
    public addScript(src: string): BaseRoute {
        this.scripts.push(src);
        return this;
    }

    /**
     * Render a page.
     *
     * @class BaseRoute
     * @method render
     * @param {Request} req The request object.
     * @param {Response} res The response object.
     * @param {String} view The view to render.
     * @param {Object} options Additional options to append to the view's local scope.
     * @return void
     */
    public render(req: Request, res: Response, view: string, options?: Object) {
        res.locals.BASE_URL = "/";
        res.locals.scripts = this.scripts;
        res.locals.title = this.title;
        res.render(view, options);
    }
}
