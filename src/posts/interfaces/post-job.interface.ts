import { LikeJobPayload } from './like-job.interface';
import { ViewJobPayload } from './view-job.interface';

export type PostJobPayload = LikeJobPayload | ViewJobPayload;
