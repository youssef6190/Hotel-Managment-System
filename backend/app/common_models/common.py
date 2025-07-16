from pydantic import BaseModel, ConfigDict, Field
from bson import ObjectId
from typing import Annotated

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            python_schema=core_schema.is_instance_schema(ObjectId),
            json_schema=core_schema.str_schema(),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

# Type for ObjectId fields
PydanticObjectId = Annotated[ObjectId, PyObjectId]

class MongoBaseModel(BaseModel):
    """Base model with configuration for MongoDB ObjectId support."""
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True) 