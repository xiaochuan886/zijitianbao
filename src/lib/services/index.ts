export * from './types'
export * from './auth.service'
export * from './organization.service'
export * from './project.service'
export * from './record.service'
export * from './user.service'
export * from './fund-type.service'
export * from './predict-record.service'

import { AuthService } from './auth.service'
import { OrganizationService } from './organization.service'
import { ProjectService } from './project.service'
import { RecordService } from './record.service'
import { UserService } from './user.service'
import { FundTypeService } from './fund-type.service'
import { PredictRecordService } from './predict-record.service'

// 服务实例
export const services = {
  auth: new AuthService(),
  organization: new OrganizationService(),
  project: new ProjectService(),
  record: new RecordService(),
  user: new UserService(),
  fundType: new FundTypeService(),
  predictRecord: new PredictRecordService(),
} 