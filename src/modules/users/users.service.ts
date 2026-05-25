import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { Gender } from '@prisma/client';

export class UsersService {
  // Get user profile by ID
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatar: true,
        gender: true,
        role: true,
        createdAt: true,
        addresses: true,
        provider: {
          select: {
            id: true,
            bio: true,
            experience: true,
            status: true,
            rating: true,
            totalReviews: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  // Update user profile
  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    gender?: Gender;
    avatar?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, phone: true, email: true,
        avatar: true, gender: true, role: true,
      },
    });
    return user;
  }

  // Add a new address
  async addAddress(userId: string, addressData: {
    label: string;
    fullAddress: string;
    landmark?: string;
    lat: number;
    lng: number;
    isDefault?: boolean;
  }) {
    // If new address is default, remove default from others
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { userId, ...addressData },
    });
    return address;
  }

  // Get all addresses for a user
  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // default address first
        { createdAt: 'desc' },
      ],
    });
  }

  // Delete an address
  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new AppError('Address not found', 404);

    await prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }
}

export default new UsersService();
