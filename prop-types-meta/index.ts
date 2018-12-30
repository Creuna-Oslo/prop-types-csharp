const metaTypes = {
  exclude: 'exclude',
  double: 'double',
  'double?': 'double?',
  float: 'float',
  'float?': 'float?',
  int: 'int',
  'int?': 'int?'
};

type TypeLiteral = {
  [key: string]: string | TypeLiteral;
};

type TypeLiteralArray<Elements> = {
  [E in keyof Elements]: PropTypesMeta<Elements[E]>
};

export type PropTypesMeta<Props> = Props extends string
  ? 'exclude'
  : {
      [P in keyof Props]?: Props[P] extends TypeLiteral | TypeLiteral[]
        ? Props[P] extends TypeLiteral[]
          ? TypeLiteralArray<Props[P]>
          : PropTypesMeta<Props[P]>
        : keyof typeof metaTypes | (keyof typeof metaTypes)[]
    };
