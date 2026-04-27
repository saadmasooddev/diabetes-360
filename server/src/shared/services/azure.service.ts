import { BlobSASPermissions, BlobServiceClient, ContainerClient, SASProtocol, StorageSharedKeyCredential, generateBlobSASQueryParameters } from '@azure/storage-blob';
import type { Response } from "express";
import { pipeline } from "node:stream/promises";
import { config } from 'server/src/app/config';

export class AzureService {
  private readonly blobServiceClient : BlobServiceClient
  private readonly containerName: string
  private readonly containerClient: ContainerClient
  private readonly sharedKeyCredential: StorageSharedKeyCredential

  constructor() {
    this.containerName = config.azure.containerName
    this.sharedKeyCredential = new StorageSharedKeyCredential("diabetes360andpos", "sv9EGFleTE2IK1zne9FT0s/ww7tkQkrWF5sUVpuda4Ukiysj+cilE5XkeifneS/8ZSmxwpj4Co/P+AStoa2EIA==");
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString)
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  createKeyForLabReports(fileName: string, userId: string){
    return `${userId}/lab-reports/${fileName}`
  }

  createKeyForProfilePicture(fileName: string, userId: string){
    return `${userId}/profile-picture/${fileName}`
  }

  async uploadFile(file: Express.Multer.File, key: string) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    return await blockBlobClient.uploadData(file.buffer, {
      blockSize: file.size,
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });
  }

  /** Upload a server-local temp file (e.g. multer diskStorage) to blob storage, then delete is caller's responsibility. */
  async uploadLocalFileToBlob(
    localFilePath: string,
    key: string,
    contentType: string,
  ) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    return await blockBlobClient.uploadFile(localFilePath, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
  }

  async pipeBlobToResponse(
    blobKey: string,
    res: Response,
    downloadFileName: string,
  ): Promise<void> {
    const blobClient = this.containerClient.getBlockBlobClient(blobKey);
    const downloadResponse = await blobClient.download();
    const contentType =
      downloadResponse.contentType || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
    );

    const body = downloadResponse.readableStreamBody;
    if (!body) {
      throw new Error("Blob download returned empty body");
    }

    await pipeline(body, res);
  }

  async deleteFile(key: string) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    return await blockBlobClient.delete();
  }

  async listFiles() {
    for await(const blob of this.containerClient.listBlobsFlat()){
      console.log("The blob name is", blob.name)
    }
  }

  async randomString() {
    return crypto.randomUUID()

  }

  async getUrl(key: string) {
    return this.containerClient.getBlockBlobClient(key).url
  }

  async generateDownloadSAS(blobName: string, expiresInMinutes = 60) {
  const blobClient = this.containerClient.getBlockBlobClient(blobName);

  const expiresOn = new Date();
  expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: this.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),  
      expiresOn,
      protocol: SASProtocol.Https,
    },
    this.sharedKeyCredential
  ).toString();

  return {
    downloadUrl: `${blobClient.url}?${sasToken}`,
    expiresOn: expiresOn.toISOString(),
  };
}

 async generateUploadSAS(blobName: string, expiresInMinutes = 15) {
  const blobClient = this.containerClient.getBlockBlobClient(blobName);

  const startsOn = new Date();
  startsOn.setMinutes(startsOn.getMinutes() - 2);

  const expiresOn = new Date();
  expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

  // Generate the SAS token with write-only permission
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: this.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('cw'),  // Create and Write only
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,  // HTTPS only for security
      // Optionally restrict content type
      contentType: undefined,
    },
    this.sharedKeyCredential
  ).toString();

  return {
    uploadUrl: `${blobClient.url}?${sasToken}`,
    blobUrl: blobClient.url,
    blobName,
    expiresOn: expiresOn.toISOString(),
  };
}

  async getBlobProperties(key: string){
    const blobClient = this.containerClient.getBlockBlobClient(key)
    return await blobClient.getProperties()
  }


}

export const azureService = new AzureService()