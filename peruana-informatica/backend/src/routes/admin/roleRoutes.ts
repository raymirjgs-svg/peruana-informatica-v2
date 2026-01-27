import { Router } from 'express';
import { roleController } from '../../controllers/roleController';
import { authenticateToken } from '../../middleware/authMiddleware';
import { checkPermission } from '../../middleware/permissions';

const router = Router();

// Roles
router.get('/roles', authenticateToken, checkPermission('manage-roles'), roleController.getAllRoles.bind(roleController));
router.get('/roles/:id', authenticateToken, checkPermission('manage-roles'), roleController.getRoleById.bind(roleController));
router.post('/roles', authenticateToken, checkPermission('manage-roles'), roleController.createRole.bind(roleController));
router.put('/roles/:id', authenticateToken, checkPermission('manage-roles'), roleController.updateRole.bind(roleController));
router.delete('/roles/:id', authenticateToken, checkPermission('manage-roles'), roleController.deleteRole.bind(roleController));

// Permissions
router.get('/permissions', authenticateToken, checkPermission('manage-roles'), roleController.getAllPermissions.bind(roleController));

// Assign role to user
router.post('/assign-role', authenticateToken, checkPermission('manage-users'), roleController.assignRoleToUser.bind(roleController));

export default router;
