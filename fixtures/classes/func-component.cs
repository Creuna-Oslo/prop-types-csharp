using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

public class FunctionalComponent 
{
  [Required]
  public string Text { get; set; }
  public bool IsSomething { get; set; }
  public int Number { get; set; }
  public int IntNumber { get; set; }
  [Required]
  public float FloatNumber { get; set; }
  public IList<string> Texts { get; set; }
  public FunctionalComponent_SingleObject SingleObject { get; set; }
  [Required]
  public IList<FunctionalComponent_ObjectsItem> Objects { get; set; }
  [Required]
  public FunctionalComponent_ShapeMeta ShapeMeta { get; set; }
  [Required]
  public IList<Link> ObjectArray { get; set; }
  public IList<IList<IList<string>>> NestedList { get; set; }
  public FunctionalComponent_NestedExclude NestedExclude { get; set; }
  public FunctionalComponent_NestedShape NestedShape { get; set; }
  public Link Link { get; set; }
  public IList<Link> LinkList { get; set; }
  public Link LinkMeta { get; set; }
  public IList<Link> LinkListMeta { get; set; }
  [Required]
  public FunctionalComponent_EnumArray EnumArray { get; set; }
  public FunctionalComponent_EnumInline EnumInline { get; set; }
  public FunctionalComponent_EnumObject EnumObject { get; set; }
}

public class FunctionalComponent_SingleObject 
{
  [Required]
  public string PropertyA { get; set; }
}

public class FunctionalComponent_ObjectsItem 
{
  [Required]
  public string PropertyB { get; set; }
}

public class FunctionalComponent_ShapeMeta
{
  public Link Object { get; set; }
}

public class FunctionalComponent_NestedExclude
{
}

public class FunctionalComponent_NestedShape
{
  public FunctionalComponent_NestedShape_A A { get; set; }
}

public class FunctionalComponent_NestedShape_A
{
  public FunctionalComponent_NestedShape_A_B B { get; set; }
}

public class FunctionalComponent_NestedShape_A_B
{
  public string C { get; set; }
}

public enum FunctionalComponent_EnumArray 
{
  [EnumMember(Value = "value-1")]
  Value1 = 0,
  [EnumMember(Value = "value-2")]
  Value2 = 1,
}

public enum FunctionalComponent_EnumInline 
{
  None = 0,
  EnumInline1 = 1,
  EnumInline2 = 2,
}

public enum FunctionalComponent_EnumObject 
{
  [EnumMember(Value = "")]
  None = 0,
  [EnumMember(Value = "valueA")]
  ValueA = 1,
  [EnumMember(Value = "valueB")]
  ValueB = 2,
}