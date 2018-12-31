type metaType =
  | 'exclude'
  | 'double'
  | 'double?'
  | 'float'
  | 'float?'
  | 'int'
  | 'int?';

type primitive = string | number | boolean;

type TypeLiteral = {
  [key: string]: primitive | TypeLiteral;
};

type TypeLiteralArray<Elements> = {
  [E in keyof Elements]: PropTypesMeta<Elements[E]>
};

type MetaTypeArray<T> = T extends Array<infer U>
  ? DeepMetaTypeArray<U>
  : metaType;

interface DeepMetaTypeArray<T> extends Array<MetaTypeArray<T>> {}

export type PropTypesMeta<Props> = Props extends string
  ? 'exclude'
  : {
      [P in keyof Props]?: Props[P] extends
        | TypeLiteral
        | TypeLiteral[]
        | undefined
        ? Props[P] extends TypeLiteral[] | undefined
          ? TypeLiteralArray<Props[P]>
          : PropTypesMeta<Props[P]> | 'exclude'
        : MetaTypeArray<Props[P]>
    };
