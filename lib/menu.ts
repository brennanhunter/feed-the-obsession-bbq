// Single source of truth for the menu. Imported by the client (MenuWrapper) AND
// the server (/api/checkout) so the server can trust prices instead of the browser.

export type MenuCategory = "BBQ Plates" | "Sides" | "Catering";

export type MenuItem = {
  id: number;
  title: string;
  description: string;
  price: number; // US dollars
  image: string;
  category: MenuCategory;
  includedSides?: number; // BBQ plates come with N sides the customer chooses
};

export const menuItems: MenuItem[] = [
  { id: 1, title: "Brisket Plate", description: "Slow-smoked beef brisket with two sides of your choice", price: 20, image: "/pictures/food/ribs.png", category: "BBQ Plates", includedSides: 2 },
  { id: 2, title: "Ribs Plate", description: "Fall-off-the-bone ribs with two sides", price: 20, image: "/pictures/food/ribs.png", category: "BBQ Plates", includedSides: 2 },
  { id: 3, title: "Pulled Pork Plate", description: "Tender pulled pork with two sides", price: 15, image: "/pictures/food/pulled-pork-transparent.png", category: "BBQ Plates", includedSides: 2 },
  { id: 4, title: "Smoked German Potatoes", description: "Creamy potatoes with a smoky finish", price: 5, image: "/pictures/food/german-potatoes-transparent.png", category: "Sides" },
  { id: 5, title: "Smoked Baked Beans", description: "Sweet and savory beans with bacon", price: 5, image: "/pictures/food/ribs.png", category: "Sides" },
  { id: 6, title: "Coleslaw", description: "Fresh and tangy cabbage slaw", price: 4, image: "/pictures/food/ribs.png", category: "Sides" },
  { id: 7, title: "Black Eyed Peas", description: "Southern-style black eyed peas", price: 5, image: "/pictures/food/ribs.png", category: "Sides" },
  { id: 8, title: "Cabbage and Ham", description: "Tender cabbage with smoked ham", price: 5, image: "/pictures/food/ribs.png", category: "Sides" },
  { id: 9, title: "Corn Salad", description: "Sweet corn with fresh vegetables", price: 4, image: "/pictures/food/ribs.png", category: "Sides" },
  { id: 10, title: "Cucumber Salad", description: "Fresh cucumber salad with herbs", price: 4, image: "/pictures/food/cucumber-transparent.png", category: "Sides" },
];

const byId = new Map(menuItems.map((i) => [i.id, i]));

/** Server-side price lookup. Returns undefined for unknown ids. */
export function getMenuItem(id: number): MenuItem | undefined {
  return byId.get(id);
}
