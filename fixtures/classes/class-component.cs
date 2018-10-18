using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

public class ClassComponent
{
  [Required]
  public string Text { get; set; }
  public bool IsSomething { get; set; }
  public int Number { get; set; }
  public int IntNumber { get; set; }
  public float FloatNumber { get; set; }
  public IList<string> Texts { get; set; }
  public ClassComponent_SingleObject SingleObject { get; set; }
  [Required]
  public IList<ClassComponent_ObjectsItem> Objects { get; set; }
  public ClassComponent_ShapeMeta ShapeMeta { get; set; }
  [Required]
  public IList<Link> ObjectArray { get; set; }
  public IList<IList<IList<string>>> NestedList { get; set; }
  public Link Link { get; set; }
  public IList<Link> LinkList { get; set; }
  public Link LinkMeta { get; set; }
  public IList<Link> LinkListMeta { get; set; }
  [Required]
  public ClassComponent_EnumArray EnumArray { get; set; }
  public ClassComponent_EnumInline EnumInline { get; set; }
  public ClassComponent_EnumObject EnumObject { get; set; }
}

public class ClassComponent_SingleObject 
{
  [Required]
  public string PropertyA { get; set; }
}

public class ClassComponent_ObjectsItem 
{
  [Required]
  public string PropertyB { get; set; }
}

public class ClassComponent_ShapeMeta
{
  public Link Object { get; set; }
}

public enum ClassComponent_EnumArray 
{
  [EnumMember(Value = "value-1")]
  Value1 = 0,
  [EnumMember(Value = "value-2")]
  Value2 = 1,
}

public enum ClassComponent_EnumInline 
{
  None = 0,
  EnumInline1 = 1,
  EnumInline2 = 2,
}

public enum ClassComponent_EnumObject 
{
  [EnumMember(Value = "")]
  None = 0,
  [EnumMember(Value = "valueA")]
  ValueA = 1,
  [EnumMember(Value = "valueB")]
  ValueB = 2,
}