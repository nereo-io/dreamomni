import { getCustomerById } from "@/models/customer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  try {
    const customer = await getCustomerById(customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ careerQuestion: customer.career_question });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: "Failed to fetch career question" },
      { status: 500 }
    );
  }
}
