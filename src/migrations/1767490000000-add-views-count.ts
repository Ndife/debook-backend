import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewsCount1767490000000 implements MigrationInterface {
  name = 'AddViewsCount1767490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post" ADD "viewsCount" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "viewsCount"`);
  }
}
