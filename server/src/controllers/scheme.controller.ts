import { Request, Response } from 'express';
import { SchemeService } from '../services/scheme.service';

export class SchemeController {
  /**
   * GET /api/schemes
   * Fetch active government schemes and policy opportunities
   */
  static async getAll(req: Request, res: Response) {
    try {
      const { category, status, state, search, featured } = req.query;

      const schemes = await SchemeService.getAllSchemes({
        category: category ? String(category) : undefined,
        status: status ? String(status) : undefined,
        state: state ? String(state) : undefined,
        search: search ? String(search) : undefined,
        isFeatured: featured !== undefined ? featured === 'true' : undefined,
      });

      return res.json({
        success: true,
        count: schemes.length,
        schemes,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch government schemes',
        error: err.message,
      });
    }
  }

  /**
   * GET /api/schemes/:id
   * Fetch single scheme with full guidelines and circular
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const scheme = await SchemeService.getSchemeById(id);

      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Government scheme not found',
        });
      }

      return res.json({
        success: true,
        scheme,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch scheme details',
        error: err.message,
      });
    }
  }

  /**
   * POST /api/schemes
   * Publish new government policy / subsidy (Admin only)
   */
  static async create(req: Request, res: Response) {
    try {
      const { title, benefitAmount, summary, eligibilityCriteria, applicationUrl } = req.body;

      if (!title || !benefitAmount || !summary || !eligibilityCriteria || !applicationUrl) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all mandatory fields (Title, Benefit Amount, Summary, Eligibility Criteria, Application URL).',
        });
      }

      const scheme = await SchemeService.createScheme(req.body, req.user?.id);

      return res.status(201).json({
        success: true,
        message: 'Government policy published successfully. Real-time updates broadcast to farmer dashboards.',
        scheme,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to publish government scheme',
        error: err.message,
      });
    }
  }

  /**
   * PUT /api/schemes/:id
   * Update existing government scheme / policy amendment (Admin only)
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const scheme = await SchemeService.updateScheme(id, req.body, req.user?.id);

      return res.json({
        success: true,
        message: 'Government policy updated successfully.',
        scheme,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update government scheme',
        error: err.message,
      });
    }
  }

  /**
   * DELETE /api/schemes/:id
   * Archive / delete government scheme (Admin only)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await SchemeService.deleteScheme(id, req.user?.id);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete government scheme',
        error: err.message,
      });
    }
  }
}
