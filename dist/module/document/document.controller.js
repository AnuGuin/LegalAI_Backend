import documentService from './document.service.js';
class DocumentController {
    async generateDocument(req, res, next) {
        try {
            const userId = req.user.id;
            const { prompt, format } = req.body;
            const result = await documentService.generateDocument(userId, prompt, format);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getDocuments(req, res, next) {
        try {
            const userId = req.user.id;
            const documents = await documentService.getUserDocuments(userId);
            res.status(200).json({
                success: true,
                data: documents,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // get document by id
    async getDocument(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Document ID is required',
                });
            }
            const document = await documentService.getDocument(userId, id);
            res.status(200).json({
                success: true,
                data: document,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteDocument(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Document ID is required',
                });
            }
            await documentService.deleteDocument(userId, id);
            res.status(200).json({
                success: true,
                message: 'Document deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new DocumentController();
//# sourceMappingURL=document.controller.js.map