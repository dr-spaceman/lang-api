import { Request, Response, NextFunction } from 'express'

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>

function asyncHandler(
  fn: AsyncRouteHandler
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export default asyncHandler
