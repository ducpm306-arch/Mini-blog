import { SetMetadata } from '@nestjs/common';
import { Role } from '../global/globalEnum.js';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
