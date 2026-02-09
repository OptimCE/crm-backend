import {inject, injectable} from "inversify";
import type {IDocumentRepository} from "../domain/i-document.repository.js";
import {AppDataSource} from "../../../shared/database/database.connector.js";
import type {QueryRunner} from "typeorm";
import {DocumentDTO, DocumentQueryDTO} from "../api/document.dtos.js";
import {Document} from "../domain/document.models.js"
import {applyFilters, applySorts, FilterDef, SortDef} from "../../../shared/database/filters.js";
import {withCommunityScope} from "../../../shared/database/withCommunity.js";
import type {IAuthContextRepository} from "../../../shared/context/i-authcontext.repository.js";
@injectable()
export class DocumentRepository implements IDocumentRepository{
    constructor(@inject("AppDataSource") private readonly dataSource: typeof AppDataSource,
                @inject("AuthContext") private readonly authContext: IAuthContextRepository) {}
    private documentFilters: FilterDef<Document>[] = [
        {
            key: 'file_name',
            apply: (qb, val) => qb.andWhere('document.file_name ILIKE :file_name', { file_name: `%${val}%` })
        },
        {
            key: 'file_type',
            apply: (qb, val) => qb.andWhere('document.file_type ILIKE :file_type', { file_type: `%${val}%` })
        }
    ];

    // Define sorts declaratively
    private documentSorts: SortDef<Document>[] = [
        {
            key: 'sort_upload_date',
            apply: (qb, direction) => qb.addOrderBy('document.upload_date', direction)
        },
        {
            key: 'sort_file_size',
            apply: (qb, direction) => qb.addOrderBy('document.file_size', direction)
        }
    ];

    async deleteDocument(document_id: number, query_runner?: QueryRunner): Promise<Document | null> {
        const manager = query_runner ? query_runner.manager : this.dataSource.manager;
        const document_to_delete: Document|null =  await this.getDocumentById(document_id, query_runner);
        if (document_to_delete) {
            return await manager.remove(document_to_delete);
        }
        return null;
    }

    getDocumentByIdNIdMember(document_id: number, member_id: string,query_runner?: QueryRunner): Promise<Document | null> {
        const manager = query_runner ? query_runner.manager : this.dataSource.manager;
        let qb = manager.createQueryBuilder(Document, 'document');
        withCommunityScope(qb, "document")
        qb = qb.andWhere("document.id = :id", {id: document_id})
        qb = qb.andWhere("document.id_member = :id", {id: member_id})
        return qb.getOne()
    }
    getDocumentById(document_id: number,query_runner?: QueryRunner): Promise<Document | null> {
        const manager = query_runner ? query_runner.manager : this.dataSource.manager;
        let qb = manager.createQueryBuilder(Document, 'document');
        withCommunityScope(qb, "document")
        qb = qb.andWhere("document.id = :id", {id: document_id})
        return qb.getOne()
    }


    async getDocuments(
        member_id: number,
        query: DocumentQueryDTO,
        query_runner?: QueryRunner,
    ): Promise<[Document[], number]> {
        // Use the transaction manager if provided, otherwise the default manager
        const manager = query_runner ? query_runner.manager : this.dataSource.manager;

        let qb = manager.createQueryBuilder(Document, 'document');
        withCommunityScope(qb, "document")

        // Base filter: Documents belonging to the member
        qb = qb.where('document.id_member = :member_id', { member_id });

        // Apply declarative filters and sorts
        qb = applyFilters(this.documentFilters, qb, query);
        qb = applySorts(this.documentSorts, qb, query);

        // Default Sort: Newest uploads first if no sort is specified in the query
        if (!query.sort_upload_date && !query.sort_file_size) {
            qb.orderBy('document.upload_date', 'DESC');
        }

        // Pagination
        const page = query.page || 1;
        const limit = query.limit || 10;

        qb.skip((page - 1) * limit);
        qb.take(limit);

        return qb.getManyAndCount();
    }

    async saveDocument(new_document: DocumentDTO, query_runner?: QueryRunner): Promise<Document> {
        const manager = query_runner ? query_runner.manager : this.dataSource.manager;
        const internal_community_id = await this.authContext.getInternalCommunityId(query_runner)
        const new_document_model = manager.create(Document, {
            file_name: new_document.file_name,
            file_url: new_document.file_url,
            upload_date: new_document.upload_date,
            file_type: new_document.file_type,
            file_size: new_document.file_size,
            member: {id: new_document.member_id},
            community: {id: internal_community_id},

        })
        return await manager.save(new_document_model)
    }


}