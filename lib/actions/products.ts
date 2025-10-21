"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import { prisma } from "../prisma";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().nonnegative("price must be non-negative"),
  quantity: z.coerce.number().int().min(0, "Quantity must be non negative"),
  sku: z.string().optional(),
  lowStockAt: z.coerce.number().int().min(0).optional(),
});

export async function deleteProduct(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") || "");

  await prisma.product.deleteMany({
    where: { id: id, userId: user.id },
  });
}

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();

  const parsed = ProductSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    sku: formData.get("sku") || undefined,
    lowStockAt: formData.get("lowStockAt") || undefined,
  });

  // if(!parsed.success){
  //     throw new Error("Validation Failed");
  // }

  // try {
  //     await prisma.product.create({
  //         data: {...parsed.data, userId:user.id},
  //     });
  //     redirect("/inventory");
  // } catch (error) {
  //     throw Error("Failed to create product");
  // }
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.flatten());
    throw new Error("Validation failed");
  }

  try {
    await prisma.product.create({
      data: { ...parsed.data, userId: user.id },
    });
    redirect("/inventory");
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error("Create Product Error:", error);
    throw new Error("Failed to create product: " + error.message);
  }
}
