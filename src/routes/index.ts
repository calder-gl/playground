import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./base_route";

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
  public index(req: Request, res: Response, next: NextFunction) {
    const options: Object = {};
    this.render(req, res, "index", options);
  }
}
