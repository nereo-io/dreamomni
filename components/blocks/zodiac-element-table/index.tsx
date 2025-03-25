"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Define Five Elements
type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

// Zodiac type
type Zodiac = {
  name: string;
  years: string[];
  element: Record<string, Element>;
  traits: string[];
  compatibility: {
    good: string[];
    bad: string[];
  };
  image: string;
  description: string;
};

// Five Elements data
const elementData = {
  Wood: {
    traits: ["Creative", "Growth", "Warmth", "Cooperative", "Generous"],
    color: "bg-green-50 text-green-800",
    borderColor: "border-green-200",
    image: "/imgs/elements/wood.png",
    description:
      "Wood represents growth and vitality, like plants emerging in spring, full of energy and upward momentum. People with Wood characteristics typically have leadership abilities, creativity, and patience.",
  },
  Fire: {
    traits: [
      "Passionate",
      "Enthusiastic",
      "Leadership",
      "Dynamic",
      "Expressive",
    ],
    color: "bg-red-50 text-red-800",
    borderColor: "border-red-200",
    image: "/imgs/elements/fire.png",
    description:
      "Fire symbolizes passion and energy, like the summer sun full of enthusiasm and power. People with Fire characteristics are typically passionate, energetic, and skilled in expression and communication.",
  },
  Earth: {
    traits: ["Stable", "Practical", "Reliable", "Conservative", "Hardworking"],
    color: "bg-yellow-50 text-yellow-800",
    borderColor: "border-yellow-200",
    image: "/imgs/elements/earth.png",
    description:
      "Earth represents stability and groundedness, like the earth providing foundation for all life. People with Earth characteristics are typically practical, reliable, and hardworking, being pillars of family and community.",
  },
  Metal: {
    traits: [
      "Strong",
      "Independent",
      "Disciplined",
      "Efficient",
      "Perfectionist",
    ],
    color: "bg-gray-50 text-gray-800",
    borderColor: "border-gray-200",
    image: "/imgs/elements/metal.png",
    description:
      "Metal symbolizes strength and determination, like the durability and purity of metal. People with Metal characteristics are typically brave, decisive, self-disciplined, pursuing perfection and efficiency.",
  },
  Water: {
    traits: ["Intelligent", "Flexible", "Sensitive", "Intuitive", "Social"],
    color: "bg-blue-50 text-blue-800",
    borderColor: "border-blue-200",
    image: "/imgs/elements/water.png",
    description:
      "Water represents wisdom and adaptability, like water flowing and adapting to any container. People with Water characteristics are typically intelligent, sensitive, flexible, with strong intuition and social skills.",
  },
};

// 生肖数据
const zodiacData: Zodiac[] = [
  {
    name: "Rat",
    years: [
      "1924",
      "1936",
      "1948",
      "1960",
      "1972",
      "1984",
      "1996",
      "2008",
      "2020",
    ],
    element: {
      "1924": "Wood",
      "1936": "Fire",
      "1948": "Earth",
      "1960": "Metal",
      "1972": "Water",
      "1984": "Wood",
      "1996": "Fire",
      "2008": "Earth",
      "2020": "Metal",
    },
    traits: ["Smart", "Witty", "Adaptable", "Alert", "Thrifty"],
    compatibility: {
      good: ["Dragon", "Monkey", "Ox"],
      bad: ["Horse", "Rabbit", "Rooster"],
    },
    image: "/imgs/zodiac/rat.png",
    description:
      "The Rat ranks first in the Chinese zodiac and symbolizes intelligence and wealth. People born in the Year of the Rat are typically clever and quick-witted, good at seizing opportunities, and highly adaptable.",
  },
  {
    name: "Ox",
    years: [
      "1925",
      "1937",
      "1949",
      "1961",
      "1973",
      "1985",
      "1997",
      "2009",
      "2021",
    ],
    element: {
      "1925": "Wood",
      "1937": "Fire",
      "1949": "Earth",
      "1961": "Metal",
      "1973": "Water",
      "1985": "Wood",
      "1997": "Fire",
      "2009": "Earth",
      "2021": "Metal",
    },
    traits: ["Hardworking", "Reliable", "Patient", "Stubborn", "Practical"],
    compatibility: {
      good: ["Rat", "Snake", "Rooster"],
      bad: ["Goat", "Horse", "Dog"],
    },
    image: "/imgs/zodiac/ox.png",
    description:
      "The Ox symbolizes diligence and perseverance in the Chinese zodiac. People born in the Year of the Ox are typically hardworking, down-to-earth, reliable, though sometimes stubborn.",
  },
  {
    name: "Tiger",
    years: [
      "1926",
      "1938",
      "1950",
      "1962",
      "1974",
      "1986",
      "1998",
      "2010",
      "2022",
    ],
    element: {
      "1926": "Wood",
      "1938": "Fire",
      "1950": "Earth",
      "1962": "Water",
      "1974": "Wood",
      "1986": "Fire",
      "1998": "Earth",
      "2010": "Metal",
      "2022": "Water",
    },
    traits: ["Brave", "Confident", "Leadership", "Competitive", "Independent"],
    compatibility: {
      good: ["Horse", "Dog", "Pig"],
      bad: ["Monkey", "Snake", "Rat"],
    },
    image: "/imgs/zodiac/tiger.png",
    description:
      "The Tiger symbolizes power and courage in the Chinese zodiac. People born in the Year of the Tiger are typically confident and brave, with strong leadership abilities and adventurous spirits, though sometimes impulsive.",
  },
  {
    name: "Rabbit",
    years: [
      "1927",
      "1939",
      "1951",
      "1963",
      "1975",
      "1987",
      "1999",
      "2011",
      "2023",
    ],
    element: {
      "1927": "Fire",
      "1939": "Earth",
      "1951": "Metal",
      "1963": "Water",
      "1975": "Wood",
      "1987": "Fire",
      "1999": "Earth",
      "2011": "Metal",
      "2023": "Water",
    },
    traits: ["Gentle", "Elegant", "Sensitive", "Artistic", "Cautious"],
    compatibility: {
      good: ["Goat", "Pig", "Dog"],
      bad: ["Rat", "Dragon", "Rooster"],
    },
    image: "/imgs/zodiac/rabbit.png",
    description:
      "The Rabbit symbolizes kindness and beauty in the Chinese zodiac. People born in the Year of the Rabbit are typically gentle and elegant, emotionally rich, artistic, though sometimes oversensitive.",
  },
  {
    name: "Dragon",
    years: [
      "1928",
      "1940",
      "1952",
      "1964",
      "1976",
      "1988",
      "2000",
      "2012",
      "2024",
    ],
    element: {
      "1928": "Earth",
      "1940": "Metal",
      "1952": "Water",
      "1964": "Wood",
      "1976": "Fire",
      "1988": "Earth",
      "2000": "Metal",
      "2012": "Water",
      "2024": "Wood",
    },
    traits: [
      "Powerful",
      "Enthusiastic",
      "Charismatic",
      "Confident",
      "Idealistic",
    ],
    compatibility: {
      good: ["Rat", "Monkey", "Rooster"],
      bad: ["Dog", "Rabbit", "Dragon"],
    },
    image: "/imgs/zodiac/dragon.png",
    description:
      "The Dragon is the only mythical creature in the Chinese zodiac, symbolizing power and good fortune. People born in the Year of the Dragon are typically energetic, charismatic, and pursue excellence, though sometimes self-centered.",
  },
  {
    name: "Snake",
    years: [
      "1929",
      "1941",
      "1953",
      "1965",
      "1977",
      "1989",
      "2001",
      "2013",
      "2025",
    ],
    element: {
      "1929": "Earth",
      "1941": "Metal",
      "1953": "Water",
      "1965": "Wood",
      "1977": "Fire",
      "1989": "Earth",
      "2001": "Metal",
      "2013": "Water",
      "2025": "Wood",
    },
    traits: ["Wise", "Mysterious", "Elegant", "Intuitive", "Cautious"],
    compatibility: {
      good: ["Ox", "Rooster", "Monkey"],
      bad: ["Tiger", "Pig", "Goat"],
    },
    image: "/imgs/zodiac/snake.png",
    description:
      "The Snake symbolizes wisdom and mystery in the Chinese zodiac. People born in the Year of the Snake are typically intelligent and wise, deep thinkers, observant, though sometimes enigmatic.",
  },
  {
    name: "Horse",
    years: [
      "1930",
      "1942",
      "1954",
      "1966",
      "1978",
      "1990",
      "2002",
      "2014",
      "2026",
    ],
    element: {
      "1930": "Metal",
      "1942": "Water",
      "1954": "Wood",
      "1966": "Fire",
      "1978": "Earth",
      "1990": "Metal",
      "2002": "Water",
      "2014": "Wood",
      "2026": "Fire",
    },
    traits: [
      "Energetic",
      "Free-spirited",
      "Enthusiastic",
      "Adventurous",
      "Frank",
    ],
    compatibility: {
      good: ["Tiger", "Goat", "Dog"],
      bad: ["Rat", "Ox", "Rabbit"],
    },
    image: "/imgs/zodiac/horse.png",
    description:
      "The Horse symbolizes vitality and freedom in the Chinese zodiac. People born in the Year of the Horse are typically energetic, freedom-loving, cheerful, though sometimes impetuous.",
  },
  {
    name: "Goat",
    years: [
      "1931",
      "1943",
      "1955",
      "1967",
      "1979",
      "1991",
      "2003",
      "2015",
      "2027",
    ],
    element: {
      "1931": "Metal",
      "1943": "Water",
      "1955": "Wood",
      "1967": "Fire",
      "1979": "Earth",
      "1991": "Metal",
      "2003": "Water",
      "2015": "Wood",
      "2027": "Fire",
    },
    traits: ["Gentle", "Artistic", "Kind", "Sensitive", "Peaceful"],
    compatibility: {
      good: ["Rabbit", "Horse", "Pig"],
      bad: ["Ox", "Dog", "Rat"],
    },
    image: "/imgs/zodiac/sheep.png",
    description:
      "The Goat symbolizes gentleness and peace in the Chinese zodiac. People born in the Year of the Goat are typically gentle and kind, compassionate, artistically talented, though sometimes indecisive.",
  },
  {
    name: "Monkey",
    years: [
      "1932",
      "1944",
      "1956",
      "1968",
      "1980",
      "1992",
      "2004",
      "2016",
      "2028",
    ],
    element: {
      "1932": "Water",
      "1944": "Wood",
      "1956": "Fire",
      "1968": "Earth",
      "1980": "Metal",
      "1992": "Water",
      "2004": "Wood",
      "2016": "Fire",
      "2028": "Earth",
    },
    traits: ["Clever", "Witty", "Flexible", "Innovative", "Playful"],
    compatibility: {
      good: ["Rat", "Dragon", "Snake"],
      bad: ["Tiger", "Pig", "Snake"],
    },
    image: "/imgs/zodiac/monkey.png",
    description:
      "The Monkey symbolizes intelligence and agility in the Chinese zodiac. People born in the Year of the Monkey are typically clever and agile, quick-thinking, highly adaptable, though sometimes crafty and changeable.",
  },
  {
    name: "Rooster",
    years: [
      "1933",
      "1945",
      "1957",
      "1969",
      "1981",
      "1993",
      "2005",
      "2017",
      "2029",
    ],
    element: {
      "1933": "Water",
      "1945": "Wood",
      "1957": "Fire",
      "1969": "Earth",
      "1981": "Metal",
      "1993": "Water",
      "2005": "Wood",
      "2017": "Fire",
      "2029": "Earth",
    },
    traits: ["Observant", "Hardworking", "Confident", "Brave", "Frank"],
    compatibility: {
      good: ["Ox", "Dragon", "Snake"],
      bad: ["Rabbit", "Dog", "Rat"],
    },
    image: "/imgs/zodiac/rooster.png",
    description:
      "The Rooster symbolizes diligence and precision in the Chinese zodiac. People born in the Year of the Rooster are typically hardworking and reliable, meticulous observers, conscientious, though sometimes overly critical.",
  },
  {
    name: "Dog",
    years: [
      "1934",
      "1946",
      "1958",
      "1970",
      "1982",
      "1994",
      "2006",
      "2018",
      "2030",
    ],
    element: {
      "1934": "Wood",
      "1946": "Fire",
      "1958": "Earth",
      "1970": "Metal",
      "1982": "Water",
      "1994": "Wood",
      "2006": "Fire",
      "2018": "Earth",
      "2030": "Metal",
    },
    traits: ["Loyal", "Honest", "Reliable", "Vigilant", "Protective"],
    compatibility: {
      good: ["Tiger", "Rabbit", "Horse"],
      bad: ["Dragon", "Rooster", "Ox"],
    },
    image: "/imgs/zodiac/dog.png",
    description:
      "The Dog symbolizes loyalty and justice in the Chinese zodiac. People born in the Year of the Dog are typically loyal and reliable, honest and righteous, protective, though sometimes overly cautious and worried.",
  },
  {
    name: "Pig",
    years: [
      "1935",
      "1947",
      "1959",
      "1971",
      "1983",
      "1995",
      "2007",
      "2019",
      "2031",
    ],
    element: {
      "1935": "Wood",
      "1947": "Fire",
      "1959": "Earth",
      "1971": "Metal",
      "1983": "Water",
      "1995": "Wood",
      "2007": "Fire",
      "2019": "Earth",
      "2031": "Metal",
    },
    traits: ["Honest", "Kind", "Generous", "Optimistic", "Pleasure-loving"],
    compatibility: {
      good: ["Tiger", "Rabbit", "Goat"],
      bad: ["Snake", "Monkey", "Pig"],
    },
    image: "/imgs/zodiac/pig.png",
    description:
      "The Pig symbolizes wealth and honesty in the Chinese zodiac. People born in the Year of the Pig are typically sincere and kind, generous, cheerful, though sometimes naive and pleasure-seeking.",
  },
];

// 组件属性类型
interface ZodiacElementTableProps {
  className?: string;
  section: {
    title: string;
    subtitle: string;
  };
}

// 生肖与五行分析表格组件
export const ZodiacElementTable: React.FC<ZodiacElementTableProps> = ({
  className,
  section,
}) => {
  const [selectedElement, setSelectedElement] = useState<Element>("Wood");
  const [selectedZodiac, setSelectedZodiac] = useState<string>("Rat");

  // 找到选择的生肖数据
  const selectedZodiacData = zodiacData.find((z) => z.name === selectedZodiac);
  return (
    <section className={cn("py-12 bg-background", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {section.title}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {section.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 五行部分 */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">
                <h3>Five Elements</h3>
              </CardTitle>
              <CardDescription>
                The Five Elements are fundamental concepts in traditional
                Chinese philosophy, representing the five basic elements that
                make up the world: Wood, Fire, Earth, Metal, and Water
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="Wood"
                onValueChange={(value) => setSelectedElement(value as Element)}
              >
                <TabsList className="grid grid-cols-5 mb-6">
                  {Object.keys(elementData).map((element) => (
                    <TabsTrigger
                      key={element}
                      value={element}
                      className="text-lg"
                    >
                      {element}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(elementData).map(([element, data]) => (
                  <TabsContent key={element} value={element}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="rounded-lg overflow-hidden h-60 relative mb-4">
                          <Image
                            src={data.image}
                            alt={`${element} Element Image`}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div
                          className={`${data.color} dark:bg-accent dark:text-accent-foreground p-4 rounded-lg shadow-sm ${data.borderColor} dark:border-accent border`}
                        >
                          <h4 className="font-semibold mb-2">Key Traits</h4>
                          <ul className="list-disc list-inside">
                            {data.traits.map((trait, index) => (
                              <li key={index}>{trait}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <p className="text-xl font-bold mb-3 text-foreground">
                          {element} Element Analysis
                        </p>
                        <p className="text-muted-foreground mb-4">
                          {data.description}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* 生肖部分 */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">
                <h3>Chinese Zodiac</h3>
              </CardTitle>
              <CardDescription>
                Select your zodiac sign and birth year to view detailed Five
                Elements analysis and compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2 mb-6">
                {zodiacData.map((zodiac) => (
                  <div
                    key={zodiac.name}
                    className={`p-2 text-center cursor-pointer rounded-lg transition-all ${
                      selectedZodiac === zodiac.name
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedZodiac(zodiac.name)}
                  >
                    <div className="w-10 h-10 relative mx-auto mb-1">
                      <Image
                        src={zodiac.image}
                        alt={zodiac.name}
                        fill
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <span className="text-sm">{zodiac.name}</span>
                  </div>
                ))}
              </div>

              {selectedZodiacData && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 relative mr-4">
                      <Image
                        src={selectedZodiacData.image}
                        alt={selectedZodiacData.name}
                        fill
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedZodiacData.name} Sign
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {selectedZodiacData.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent/30 p-3 rounded-lg border border-border">
                      <h4 className="font-semibold mb-2 text-foreground">
                        Personality Traits
                      </h4>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {selectedZodiacData.traits.map((trait, index) => (
                          <li key={index}>{trait}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-secondary/30 p-3 rounded-lg border border-border">
                      <h4 className="font-semibold mb-2 text-foreground">
                        Compatibility
                      </h4>
                      <div className="text-muted-foreground">
                        <p className="mb-1">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Good Match:
                          </span>{" "}
                          {selectedZodiacData.compatibility.good.join(", ")}
                        </p>
                        <p>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            Poor Match:
                          </span>{" "}
                          {selectedZodiacData.compatibility.bad.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 年份与五行对照表 */}
        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              <h3>
                Zodiac Years and Five Elements Reference Table (1944-2031)
              </h3>
            </CardTitle>
            <CardDescription>
              People born in different years under the same zodiac sign have
              different Five Element attributes, which influence their
              personality and destiny
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="py-2 px-3 border-b border-border bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    生肖
                  </th>
                  {["Wood", "Fire", "Earth", "Metal", "Water"].map(
                    (element) => (
                      <th
                        key={element}
                        className="py-2 px-3 border-b border-border bg-muted text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {element}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zodiacData.map((zodiac) => (
                  <tr key={zodiac.name} className="hover:bg-muted/40">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 relative">
                          <Image
                            src={zodiac.image}
                            alt={zodiac.name}
                            fill
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                        <div className="ml-3">
                          <span className="text-sm font-medium text-foreground">
                            {zodiac.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    {["Wood", "Fire", "Earth", "Metal", "Water"].map(
                      (element) => (
                        <td
                          key={element}
                          className="py-2 px-3 whitespace-nowrap text-sm text-center text-muted-foreground"
                        >
                          {zodiac.years
                            .filter((year) => zodiac.element[year] === element)
                            .join(", ")}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
