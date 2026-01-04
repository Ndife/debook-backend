import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostsTables1767475899461 implements MigrationInterface {
  name = 'CreatePostsTables1767475899461';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" character varying NOT NULL, "userId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_754a5e1d4e513c739e9c39a8d79" UNIQUE ("postId", "userId"), CONSTRAINT "PK_0e95caa8a8b56d7797569cf5dc6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_789b3f929eb3d8760419f87c8a" ON "post_like" ("postId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_789b3f929eb3d8760419f87c8a"`,
    );
    await queryRunner.query(`DROP TABLE "post_like"`);
    await queryRunner.query(`DROP TABLE "post"`);
  }
}
