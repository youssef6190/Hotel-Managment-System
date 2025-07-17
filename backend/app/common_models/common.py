from pydantic import BaseModel, ConfigDict, Field
from bson import ObjectId
from typing import Annotated, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic_core import core_schema
from bson import ObjectId
from typing import Annotated, Union, Any

class PyObjectId:
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler
    ) -> core_schema.CoreSchema:
        def validate_object_id(value: Any) -> ObjectId | None:
            # Handle None, empty string, or already ObjectId instances
            if value is None or value == "" or value == "null":
                return None
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str):
                if not ObjectId.is_valid(value):
                    raise ValueError(f"Invalid ObjectId format: {value}")
                return ObjectId(value)
            raise ValueError(f"Invalid ObjectId type: {type(value)}")

        return core_schema.no_info_plain_validator_function(
            validate_object_id,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x) if x is not None else None,
                return_schema=core_schema.str_schema(),
            ),
        )

# Type for ObjectId fields - can be None, empty string, or valid ObjectId string
PydanticObjectId = Annotated[Union[ObjectId, None], PyObjectId()]

class MongoBaseModel(BaseModel):
    """Base model with configuration for MongoDB ObjectId support."""
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True) 