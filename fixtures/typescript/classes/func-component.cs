using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

public class FuncComponentProps
{
  [Required]
  public string Text { get; set; }
  public bool IsSomething { get; set; }
  public int Number { get; set; }
  public int IntNumber { get; set; }
  public float FloatNumber { get; set; }
  public IList<string> Texts { get; set; }
  public FuncComponentProps_SingleObject SingleObject { get; set; }
  [Required]
  public IList<FuncComponentProps_Objects> Objects { get; set; }
  [Required]
  public IList<Link> ObjectArray { get; set; }
  public IList<IList<IList<string>>> NestedList { get; set; }
  public FuncComponentProps_NestedExclude NestedExclude { get; set; }
  public IList<IList<IList<float>>> NestedNumber { get; set; }
  public FuncComponentProps_NestedShape NestedShape { get; set; }
  public Link Link { get; set; }
  public IList<Link> LinkList { get; set; }
  public Link LinkMeta { get; set; }
  public IList<Link> LinkListMeta { get; set; }
  [Required]
  public FuncComponentProps_RequiredEnum RequiredEnum { get; set; }
  public FuncComponentProps_OptionalEnum OptionalEnum { get; set; }
}

public class FuncComponentProps_SingleObject 
{
  [Required]
  public string PropertyA { get; set; }
}

public class FuncComponentProps_Objects 
{
  [Required]
  public string PropertyB { get; set; }
}

public class FuncComponentProps_NestedExclude
{
}

public class FuncComponentProps_NestedShape
{
  public FuncComponentProps_NestedShape_A A { get; set; }
}

public class FuncComponentProps_NestedShape_A
{
  public FuncComponentProps_NestedShape_A_B B { get; set; }
}

public class FuncComponentProps_NestedShape_A_B
{
  public float C { get; set; }
}

public enum FuncComponentProps_RequiredEnum
{
  [EnumMember(Value = "value-a")]
  ValueA = 0,
  [EnumMember(Value = "value-b")]
  ValueB = 1,
}

public enum FuncComponentProps_OptionalEnum
{
  [EnumMember(Value = "")]
  None = 0,
  [EnumMember(Value = "value-a")]
  ValueA = 1,
  [EnumMember(Value = "value-b")]
  ValueB = 2,
}