using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

public class ClassComponentProps
{
  [Required]
  public string Text { get; set; }
  public bool IsSomething { get; set; }
  public int Number { get; set; }
  public int IntNumber { get; set; }
  public float FloatNumber { get; set; }
  public IList<string> Texts { get; set; }
  public ClassComponentProps_SingleObject SingleObject { get; set; }
  [Required]
  public IList<ClassComponentProps_ObjectsItem> Objects { get; set; }
  [Required]
  public IList<Link> ObjectArray { get; set; }
  public IList<IList<IList<string>>> NestedList { get; set; }
  public ClassComponentProps_NestedExclude NestedExclude { get; set; }
  public IList<IList<IList<float>>> NestedNumber { get; set; }
  public ClassComponentProps_NestedShape NestedShape { get; set; }
  public Link Link { get; set; }
  public IList<Link> LinkList { get; set; }
  public Link LinkMeta { get; set; }
  public IList<Link> LinkListMeta { get; set; }
  [Required]
  public ClassComponentProps_RequiredEnum RequiredEnum { get; set; }
  public ClassComponentProps_OptionalEnum OptionalEnum { get; set; }
}

public class ClassComponentProps_SingleObject 
{
  [Required]
  public string PropertyA { get; set; }
}

public class ClassComponentProps_ObjectsItem 
{
  [Required]
  public string PropertyB { get; set; }
}

public class ClassComponentProps_NestedExclude
{
}

public class ClassComponentProps_NestedShape
{
  public ClassComponentProps_NestedShape_A A { get; set; }
}

public class ClassComponentProps_NestedShape_A
{
  public ClassComponentProps_NestedShape_A_B B { get; set; }
}

public class ClassComponentProps_NestedShape_A_B
{
  public float C { get; set; }
}

public enum ClassComponentProps_RequiredEnum
{
  [EnumMember(Value = "value-a")]
  ValueA = 0,
  [EnumMember(Value = "value-b")]
  ValueB = 1,
}

public enum ClassComponentProps_OptionalEnum
{
  [EnumMember(Value = "")]
  None = 0,
  [EnumMember(Value = "value-a")]
  ValueA = 1,
  [EnumMember(Value = "value-b")]
  ValueB = 2,
}