import { PortalKernel } from '../kernel/PortalKernel';

const kernel = new PortalKernel();

export default {
  async fetch(request: Request): Promise<Response> {
    return kernel.handle(request);
  }
};
