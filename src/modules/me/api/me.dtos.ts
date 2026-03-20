import { CompanyDTO, IndividualDTO, MemberPartialQuery, MembersPartialDTO } from "../../members/api/member.dtos.js";
import { IsOptional, IsString } from "class-validator";
import { Expose, Type } from "class-transformer";
import { withError } from "../../../shared/errors/dtos.errors.validation.js";
import { ME_ERRORS } from "../shared/me.errors.js";
import { CommunityDTO } from "../../communities/api/community.dtos.js";
import { MeterPartialQuery, MetersDTO, PartialMeterDTO } from "../../meters/api/meter.dtos.js";
import { DocumentExposedDTO, DocumentQueryDTO } from "../../documents/api/document.dtos.js";

export class MeMemberPartialQuery extends MemberPartialQuery {
  @Type(() => String)
  @IsString(withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  community_name?: string;
}

export class MeMetersPartialQuery extends MeterPartialQuery {
  @Type(() => String)
  @IsString(withError(ME_ERRORS.GENERIC_VALIDATION.WRONG_TYPE.STRING))
  @IsOptional()
  community_name?: string;
}

export class MeDocumentPartialQuery extends DocumentQueryDTO {}

export class MeMembersPartialDTO extends MembersPartialDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeIndividualDTO extends IndividualDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeCompanyDTO extends CompanyDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MePartialMeterDTO extends PartialMeterDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeMeterDTO extends MetersDTO {
  @Expose()
  community!: CommunityDTO;
}

export class MeDocumentDTO extends DocumentExposedDTO {
  @Expose()
  community!: CommunityDTO;
}
