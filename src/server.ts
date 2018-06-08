import * as bodyParser from "body-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import * as errorHandler from "errorhandler";

import { IndexRoute } from "./routes/index";

/**
 * The server.
 *
 * @class Server
 */
export class Server {
  public app: express.Application;

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Instantiate a new `Server` object.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    this.app = express();
    this.config();
    this.routes();
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    // Add static paths
    this.app.use(express.static(path.join(__dirname, "public")));

    // Configure PugJS
    this.app.set("views", path.join(__dirname, "public/views"));
    this.app.set("view engine", "pug");

    // Mount logger
    this.app.use(logger("dev"));

    // Mount query string parser
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));

    // Catch 404 and forward to error handler
    this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      err.status = 404;
      next(err);
    });

    // Error handling
    this.app.use(errorHandler());
  }

  /**
   * Create and return Router.
   *
   * @class Server
   * @method routes
   * @return void
   */
  private routes() {
    let router: express.Router;
    router = express.Router();
    IndexRoute.create(router);
    this.app.use(router);
  }
}
