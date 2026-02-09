import { DataSource } from "typeorm";
import config from "config";
import {Community, CommunityUser} from "../../modules/communities/domain/community.models.js";
import {AllocationKey, Consumer, Iteration} from "../../modules/keys/domain/key.models.js";
import {Individual, Company, Manager, Member} from "../../modules/members/domain/member.models.js";
import {Document} from "../../modules/documents/domain/document.models.js";
import {Meter, MeterConsumption, MeterData} from "../../modules/meters/domain/meter.models.js";
import {
    SharingOpConsumption,
    SharingOperation,
    SharingOperationKey
} from "../../modules/sharing_operations/domain/sharing_operation.models.js";
import {
    User,
    UserMemberLink
} from "../../modules/users/domain/user.models.js";
import {GestionnaireInvitation, UserMemberInvitation} from "../../modules/invitations/domain/invitation.models.js";
import {Address} from "../address/address.models.js";


const host: string = config.get("database.host");
const port: number = config.get("database.port");
const username: string = config.get("database.username");
const password: string = config.get("database.password");
const database: string = config.get("database.database");
const logging: boolean = config.get("database.logging");
/**
 * TypeORM DataSource instance for connecting to the PostgreSQL database
 * @type {DataSource} Configured TypeORM DataSource
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: host,
  port: port,
  username: username,
  password: password,
  synchronize: false,
  database: database,
  entities: [
      Community,
      Address,
      AllocationKey,
      Iteration,
      Consumer,
      Member, Manager,
      Individual,
      Company,
      Document,
      Meter,
      SharingOperation,
      SharingOperationKey,
      MeterData,
      MeterConsumption,
      SharingOpConsumption,
      User,
      UserMemberLink,
      UserMemberInvitation,
      GestionnaireInvitation,
      CommunityUser
  ],
  logging: logging,
});
