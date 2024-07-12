import { v2 as cloudinary } from 'cloudinary';
class CommonService {
  static async deleteFileOnCloud(publicIdList) {
    await Promise.all(
      publicIdList.map(async ({ public_id, type }) => {
        let resource_type = 'raw';
        if (type === 'image') resource_type = 'image';
        if (type === 'video' || type === 'audio') resource_type = 'video';
        return await cloudinary.uploader.destroy(public_id, { resource_type });
      })
    );
  }
}
export default CommonService;
