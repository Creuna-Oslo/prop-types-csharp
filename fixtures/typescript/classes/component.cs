using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

public class ComponentProps
{
  [Required]
  public string Text { get; set; }
  public bool IsSomething { get; set; }
  public int Number { get; set; }
  public int IntNumber { get; set; }
  public float FloatNumber { get; set; }
  public IList<string> Texts { get; set; }
  public ComponentProps_SingleObject SingleObject { get; set; }
  [Required]
  public IList<ComponentProps_ObjectsItem> Objects { get; set; }
  [Required]
  public IList<Link> ObjectArray { get; set; }
  public IList<IList<IList<string>>> NestedList { get; set; }
  public ComponentProps_NestedExclude NestedExclude { get; set; }
  public IList<IList<IList<float>>> NestedNumber { get; set; }
  public ComponentProps_NestedShape NestedShape { get; set; }
  public Link Link { get; set; }
  public IList<Link> LinkList { get; set; }
  public Link LinkMeta { get; set; }
  public IList<Link> LinkListMeta { get; set; }
  [Required]
  public ComponentProps_RequiredEnum RequiredEnum { get; set; }
  public ComponentProps_OptionalEnum OptionalEnum { get; set; }
}

public class ComponentProps_SingleObject 
{
  [Required]
  public string PropertyA { get; set; }
}

public class ComponentProps_ObjectsItem 
{
  [Required]
  public string PropertyB { get; set; }
}

public class ComponentProps_NestedExclude
{
}

public class ComponentProps_NestedShape
{
  public ComponentProps_NestedShape_A A { get; set; }
}

public class ComponentProps_NestedShape_A
{
  public ComponentProps_NestedShape_A_B B { get; set; }
}

public class ComponentProps_NestedShape_A_B
{
  public string C { get; set; }
}

public enum ComponentProps_RequiredEnum
{
  [EnumMember(Value = "value-a")]
  ValueA = 0,
  [EnumMember(Value = "value-b")]
  ValueB = 1,
}

public enum ComponentProps_OptionalEnum
{
  [EnumMember(Value = "")]
  None = 0,
  [EnumMember(Value = "value-a")]
  ValueA = 1,
  [EnumMember(Value = "value-b")]
  ValueB = 2,
}