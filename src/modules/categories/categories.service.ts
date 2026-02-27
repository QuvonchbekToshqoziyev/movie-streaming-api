import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name }, { slug: dto.slug }] },
    });
    if (existing)
      throw new ConflictException(
        'Kategoriya nomi yoki slug allaqachon mavjud',
      );

    const category = await this.prisma.category.create({ data: dto });
    return { success: true, data: category };
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { movieCategories: true } } },
    });
    return { success: true, data: categories };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { movieCategories: true } } },
    });
    if (!category) throw new NotFoundException(`Kategoriya #${id} topilmadi`);
    return { success: true, data: category };
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const category = await this.prisma.category.update({ where: { id }, data: dto });
    return { success: true, message: 'Kategoriya muvaffaqiyatli yangilandi', data: category };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { success: true, message: `Kategoriya #${id} o'chirildi` };
  }
}
